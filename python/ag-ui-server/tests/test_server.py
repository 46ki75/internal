"""Hermetic integration test for the FastAPI server wiring (no AWS / no model).

Mocks the SSM token fetch and the Claude Agent SDK ``query()`` so the SSE
pipeline (RUN_STARTED → translated events → RUN_FINISHED) can be exercised
without network access.
"""

from __future__ import annotations

from typing import Any

import pytest
from claude_agent_sdk import StreamEvent
from starlette.testclient import TestClient

import ag_ui_server.server as server


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Any:
    monkeypatch.setenv("CLAUDE_CODE_OAUTH_TOKEN_PARAM", "/test/token")
    monkeypatch.setattr(server, "fetch_oauth_token", lambda config: "dummy-token")
    monkeypatch.setattr(server, "configure_sdk_env", lambda token: None)

    def fake_query(*, prompt: str, options: Any) -> Any:
        async def _gen() -> Any:
            yield StreamEvent(
                uuid="u",
                session_id="s",
                event={
                    "type": "content_block_start",
                    "index": 0,
                    "content_block": {"type": "text", "text": ""},
                },
            )
            yield StreamEvent(
                uuid="u",
                session_id="s",
                event={
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "text_delta", "text": "Hi there"},
                },
            )
            yield StreamEvent(
                uuid="u",
                session_id="s",
                event={"type": "content_block_stop", "index": 0},
            )

        return _gen()

    monkeypatch.setattr(server, "query", fake_query)

    with TestClient(server.app) as test_client:
        yield test_client


def test_ping_reports_healthy(client: Any) -> None:
    response = client.get("/ping")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Healthy"
    assert isinstance(body["time_of_last_update"], int)


def test_invocations_streams_agui_events(client: Any) -> None:
    response = client.post(
        "/invocations",
        json={
            "threadId": "thread_1",
            "runId": "run_1",
            "state": {},
            "messages": [{"id": "m1", "role": "user", "content": "Hello"}],
            "tools": [],
            "context": [],
            "forwardedProps": {},
        },
        headers={"Accept": "text/event-stream"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")

    body = response.text
    assert '"type":"RUN_STARTED"' in body
    assert '"type":"TEXT_MESSAGE_START"' in body
    assert '"delta":"Hi there"' in body
    assert '"type":"TEXT_MESSAGE_END"' in body
    assert '"type":"RUN_FINISHED"' in body
    # RUN_STARTED must come first and RUN_FINISHED last.
    assert body.index("RUN_STARTED") < body.index("TEXT_MESSAGE_START")
    assert body.index("TEXT_MESSAGE_END") < body.index("RUN_FINISHED")
