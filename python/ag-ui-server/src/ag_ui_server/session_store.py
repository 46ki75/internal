# boto3's resource API and the SDK's TypedDict session types are dynamically
# typed, so this module opts down to basic type checking.
# pyright: basic
"""A DynamoDB-backed :class:`~claude_agent_sdk.SessionStore`.

The Claude Agent SDK mirrors each session's transcript (one JSONL line per
``SessionStoreEntry``) to this adapter via :meth:`append`, and rehydrates a
session for ``resume`` via :meth:`load`. Subagent transcripts arrive under the
same session with a ``subpath`` and are discoverable through :meth:`list_subkeys`.

Storage model — one DynamoDB item per transcript entry:

- ``pk`` = ``"<project_key>#<session_id>"`` — one partition per session, so
  the whole session (main transcript + every subagent ``subpath``) lives
  together: :meth:`list_subkeys` and the cascade in :meth:`delete` are a single
  ``Query``/scan of that partition.
- ``sk`` = ``"<subpath>#<order>#<kind>#<id>"``. ``order`` is a zero-padded
  counter placed first so a Query returns a subpath's entries already in append
  order, and the next counter value is a single descending ``Limit=1`` read — no
  full scan as the transcript grows. ``kind`` is ``u`` for an entry with a stable
  ``uuid`` (``id`` = that uuid, so a re-append overwrites itself — idempotent) or
  ``n`` for one without (``id`` = random hex, never deduped, per the contract).
  ``#`` is the conventional single-table delimiter and can't occur in any
  component here (``session_id``/``uuid`` are UUIDs, ``project_key`` is the fixed
  container cwd, ``subpath`` is SDK-controlled), so prefix queries are
  unambiguous. ``order`` is also kept as an attribute for readability and a
  backend-agnostic sort on :meth:`load`.

The SDK guarantees the local-disk transcript is already durable before calling
:meth:`append`, so a failed mirror is non-fatal (it retries, then surfaces a
``MirrorErrorMessage``). Retention is ours: items carry a ``ttl`` attribute for
DynamoDB TTL. This is an experimental, single-runtime store — concurrent writers
to the *same* session would race the order counter; that doesn't happen with one
runtime per session.
"""

from __future__ import annotations

import json
import threading
import time
from typing import TYPE_CHECKING, Any
from uuid import uuid4

import boto3
from anyio.to_thread import run_sync
from boto3.dynamodb.conditions import Key
from claude_agent_sdk import SessionStore

if TYPE_CHECKING:
    from claude_agent_sdk import (
        SessionKey,
        SessionListSubkeysKey,
        SessionStoreEntry,
        SessionStoreListEntry,
        SessionSummaryEntry,
    )

# Composite-key delimiter — the DynamoDB single-table idiom. Safe because no key
# component contains it: session_id/uuid are UUIDs, project_key is the fixed
# container cwd, and subpath is SDK-controlled (``subagents/…``). Keeps the keys
# legible in the console (the whole point of this observability-focused store).
_SEP = "#"


class DynamoDBSessionStore(SessionStore):
    """Mirror Claude Agent SDK session transcripts to a DynamoDB table."""

    def __init__(
        self,
        table_name: str,
        *,
        table: Any | None = None,
        region: str | None = None,
        ttl_days: int = 30,
    ) -> None:
        # ``table`` is injectable so tests can substitute the three primitives
        # below without standing up DynamoDB.
        if table is None:
            resource: Any = boto3.resource("dynamodb", region_name=region)
            table = resource.Table(table_name)
        self._table: Any = table
        self._ttl_days = ttl_days
        self._lock = threading.Lock()
        # (pk, subpath) -> {"next": int, "uuids": {uuid: order}} — seeded lazily
        # from the store (next counter via one O(1) read; uuids fills in-process).
        self._order: dict[str, dict[str, Any]] = {}

    # --- required methods -------------------------------------------------

    async def append(
        self, key: SessionKey, entries: list[SessionStoreEntry]
    ) -> None:
        await run_sync(self._append_sync, key, entries)

    async def load(self, key: SessionKey) -> list[SessionStoreEntry] | None:
        return await run_sync(self._load_sync, key)

    # --- optional methods -------------------------------------------------

    async def list_subkeys(self, key: SessionListSubkeysKey) -> list[str]:
        return await run_sync(self._list_subkeys_sync, key)

    async def delete(self, key: SessionKey) -> None:
        await run_sync(self._delete_sync, key)

    # This store powers resume, not session browsing, so the listing methods are
    # left unimplemented (the SessionStore protocol still requires them to exist;
    # the conformance suite skips them via ``skip_optional``).
    async def list_sessions(self, project_key: str) -> list[SessionStoreListEntry]:
        raise NotImplementedError

    async def list_session_summaries(
        self, project_key: str
    ) -> list[SessionSummaryEntry]:
        raise NotImplementedError

    # --- synchronous implementations (run in a worker thread) -------------

    def _append_sync(
        self, key: SessionKey, entries: list[SessionStoreEntry]
    ) -> None:
        pk = self._pk(key)
        subpath = key.get("subpath") or ""
        cache_key = f"{pk}{_SEP}{subpath}"
        now_ttl = int(time.time()) + self._ttl_days * 86400 if self._ttl_days else 0

        items: list[dict[str, Any]] = []
        with self._lock:
            state = self._order.get(cache_key) or self._seed_order(pk, subpath)
            self._order[cache_key] = state
            for entry in entries:
                uid = entry.get("uuid") or None
                if uid is not None and uid in state["uuids"]:
                    order = state["uuids"][uid]
                else:
                    order = state["next"]
                    state["next"] += 1
                    if uid is not None:
                        state["uuids"][uid] = order
                item: dict[str, Any] = {
                    "pk": pk,
                    "sk": self._sk(subpath, order, uid),
                    "subpath": subpath,
                    "order": order,
                    "body": json.dumps(entry, ensure_ascii=False),
                }
                if uid is not None:
                    item["uuid"] = uid
                if now_ttl:
                    item["ttl"] = now_ttl
                items.append(item)
        self._put_batch(items)

    def _load_sync(self, key: SessionKey) -> list[SessionStoreEntry] | None:
        pk = self._pk(key)
        subpath = key.get("subpath") or ""
        items = self._query(pk, f"{subpath}{_SEP}")
        if not items:
            return None
        items.sort(key=lambda it: int(it["order"]))
        return [json.loads(it["body"]) for it in items]

    def _list_subkeys_sync(self, key: SessionListSubkeysKey) -> list[str]:
        pk = self._pk(key)
        subpaths = {
            sp for it in self._query(pk, None) if (sp := it.get("subpath") or "")
        }
        return sorted(subpaths)

    def _delete_sync(self, key: SessionKey) -> None:
        pk = self._pk(key)
        subpath = key.get("subpath")
        # A targeted subpath delete removes only that transcript; a main-key
        # delete (no subpath) cascades to every subkey in the partition.
        prefix = f"{subpath}{_SEP}" if subpath else None
        items = self._query(pk, prefix)
        self._delete_keys([(it["pk"], it["sk"]) for it in items])
        with self._lock:
            if subpath:
                self._order.pop(f"{pk}{_SEP}{subpath}", None)
            else:
                for ck in [k for k in self._order if k.startswith(f"{pk}{_SEP}")]:
                    self._order.pop(ck, None)

    # --- helpers ----------------------------------------------------------

    @staticmethod
    def _pk(key: SessionKey | SessionListSubkeysKey) -> str:
        return f"{key['project_key']}{_SEP}{key['session_id']}"

    @staticmethod
    def _sk(subpath: str, order: int, uid: str | None) -> str:
        # uuid-keyed suffix → a re-append (same uuid, same cached order) yields
        # the same sk and overwrites in place; no-uuid entries get a random id so
        # they always append (never dedup), per the contract.
        suffix = f"u{_SEP}{uid}" if uid else f"n{_SEP}{uuid4().hex}"
        return f"{subpath}{_SEP}{order:020d}{_SEP}{suffix}"

    def _seed_order(self, pk: str, subpath: str) -> dict[str, Any]:
        """Resume the order counter from the store with one O(1) read.

        ``order`` is the first sortable sort-key component, so the highest
        existing order is just the last item under the subpath prefix. The
        uuid→order map starts empty: across a restart the SDK only appends *new*
        entries (it never re-appends an already-stored uuid), so we need the next
        counter value, not the full dedup map — which keeps this O(1) rather than
        a full transcript scan on every cold turn.
        """
        last = self._query_last(pk, f"{subpath}{_SEP}")
        return {"next": int(last["order"]) + 1 if last else 0, "uuids": {}}

    # --- DynamoDB primitives (the only AWS-touching code; overridden in tests)

    def _put_batch(self, items: list[dict[str, Any]]) -> None:
        # overwrite_by_pkeys collapses duplicate (pk, sk) within one batch so a
        # uuid repeated in a single append doesn't trip BatchWriteItem.
        with self._table.batch_writer(overwrite_by_pkeys=["pk", "sk"]) as writer:
            for item in items:
                writer.put_item(Item=item)

    def _query(self, pk: str, sk_prefix: str | None) -> list[dict[str, Any]]:
        condition = Key("pk").eq(pk)
        if sk_prefix is not None:
            condition = condition & Key("sk").begins_with(sk_prefix)
        items: list[dict[str, Any]] = []
        kwargs: dict[str, Any] = {"KeyConditionExpression": condition}
        while True:
            response = self._table.query(**kwargs)
            items.extend(response.get("Items", []))
            start_key = response.get("LastEvaluatedKey")
            if not start_key:
                return items
            kwargs["ExclusiveStartKey"] = start_key

    def _query_last(self, pk: str, sk_prefix: str) -> dict[str, Any] | None:
        # Highest sk under the prefix = highest order (it leads the sort key).
        condition = Key("pk").eq(pk) & Key("sk").begins_with(sk_prefix)
        response = self._table.query(
            KeyConditionExpression=condition, ScanIndexForward=False, Limit=1
        )
        items = response.get("Items", [])
        return items[0] if items else None

    def _delete_keys(self, keys: list[tuple[str, str]]) -> None:
        if not keys:
            return
        with self._table.batch_writer() as writer:
            for pk, sk in keys:
                writer.delete_item(Key={"pk": pk, "sk": sk})
