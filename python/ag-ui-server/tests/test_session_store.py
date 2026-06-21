"""Tests for the DynamoDB-backed SessionStore.

Runs the Claude Agent SDK's own conformance suite plus focused checks for the
behaviors we most care to observe (ordering, idempotency, subagent isolation,
cascade delete). The three DynamoDB primitives are overridden with an in-memory
dict so no AWS is touched; all the adapter's key/order/dedup logic still runs.
"""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING, Any

import anyio
from claude_agent_sdk.testing.session_store_conformance import (
    run_session_store_conformance,
)

from ag_ui_server.session_store import DynamoDBSessionStore

if TYPE_CHECKING:
    from claude_agent_sdk import SessionKey


def _entries(*items: dict[str, Any]) -> Any:
    """Build a transcript-entry list (SessionStoreEntry allows opaque keys)."""
    return list(items)


class _InMemoryStore(DynamoDBSessionStore):
    """A DynamoDBSessionStore whose storage primitives live in a dict."""

    def __init__(self) -> None:
        self._table = None
        self._ttl_days = 0
        self._lock = threading.Lock()
        self._order = {}
        self._items: dict[tuple[str, str], dict[str, Any]] = {}

    def _put_batch(self, items: list[dict[str, Any]]) -> None:
        for item in items:
            self._items[(item["pk"], item["sk"])] = dict(item)

    def _query(self, pk: str, sk_prefix: str | None) -> list[dict[str, Any]]:
        return [
            dict(item)
            for (item_pk, sk), item in self._items.items()
            if item_pk == pk and (sk_prefix is None or sk.startswith(sk_prefix))
        ]

    def _query_last(self, pk: str, sk_prefix: str) -> dict[str, Any] | None:
        matches = self._query(pk, sk_prefix)
        return max(matches, key=lambda item: item["sk"]) if matches else None

    def _delete_keys(self, keys: list[tuple[str, str]]) -> None:
        for key in keys:
            self._items.pop(key, None)


def test_session_store_conformance() -> None:
    async def _run() -> None:
        await run_session_store_conformance(
            _InMemoryStore,
            skip_optional=frozenset({"list_sessions", "list_session_summaries"}),
        )

    anyio.run(_run)


def test_roundtrip_idempotency_and_order() -> None:
    store = _InMemoryStore()
    key: SessionKey = {"project_key": "p", "session_id": "s"}
    first: Any = {"type": "user", "uuid": "u1", "message": {"content": "hi"}}
    second: Any = {"type": "assistant", "uuid": "u2", "message": {"content": "yo"}}

    anyio.run(store.append, key, [first])
    anyio.run(store.append, key, [second])
    # Re-append the first entry (a mirror retry): must not duplicate or reorder.
    anyio.run(store.append, key, [first])

    assert anyio.run(store.load, key) == [first, second]


def test_subagent_isolation_and_subkeys() -> None:
    store = _InMemoryStore()
    main: SessionKey = {"project_key": "p", "session_id": "s"}
    sub: SessionKey = {"project_key": "p", "session_id": "s", "subpath": "subagents/a"}

    anyio.run(store.append, main, _entries({"type": "user", "uuid": "m1"}))
    anyio.run(store.append, sub, _entries({"type": "user", "uuid": "a1"}))

    assert anyio.run(store.list_subkeys, main) == ["subagents/a"]
    # The main transcript load must not pick up subagent entries, and vice versa.
    loaded_main: Any = anyio.run(store.load, main)
    loaded_sub: Any = anyio.run(store.load, sub)
    assert [e["uuid"] for e in loaded_main] == ["m1"]
    assert [e["uuid"] for e in loaded_sub] == ["a1"]


def test_delete_main_cascades_to_subagents() -> None:
    store = _InMemoryStore()
    main: SessionKey = {"project_key": "p", "session_id": "s"}
    sub: SessionKey = {"project_key": "p", "session_id": "s", "subpath": "a"}

    anyio.run(store.append, main, _entries({"type": "x", "uuid": "m1"}))
    anyio.run(store.append, sub, _entries({"type": "x", "uuid": "a1"}))
    anyio.run(store.delete, main)

    assert anyio.run(store.load, main) is None
    assert anyio.run(store.load, sub) is None


def test_load_missing_session_returns_none() -> None:
    store = _InMemoryStore()
    missing: SessionKey = {"project_key": "p", "session_id": "missing"}
    assert anyio.run(store.load, missing) is None
