"""Tests for the Claude Agent SDK → AG-UI event bridge."""

from __future__ import annotations

from typing import Any

import anyio
import pytest
from ag_ui.core import EventType
from claude_agent_sdk import ResultMessage, StreamEvent, ToolResultBlock, UserMessage

from ag_ui_server.agui_bridge import AgentRunError, translate


def _stream(event: dict[str, Any]) -> StreamEvent:
    return StreamEvent(uuid="u", session_id="s", event=event)


def _collect(messages: list[Any]) -> list[Any]:
    async def _aiter() -> Any:
        for message in messages:
            yield message

    async def _run() -> list[Any]:
        return [event async for event in translate(_aiter())]

    return anyio.run(_run)


def test_text_block_streams_start_content_end() -> None:
    events = _collect(
        [
            _stream({"type": "message_start", "message": {}}),
            _stream(
                {
                    "type": "content_block_start",
                    "index": 0,
                    "content_block": {"type": "text", "text": ""},
                }
            ),
            _stream(
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "text_delta", "text": "Hel"},
                }
            ),
            _stream(
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "text_delta", "text": "lo"},
                }
            ),
            _stream({"type": "content_block_stop", "index": 0}),
            _stream({"type": "message_stop"}),
        ]
    )

    assert [e.type for e in events] == [
        EventType.TEXT_MESSAGE_START,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_CONTENT,
        EventType.TEXT_MESSAGE_END,
    ]
    # All four events share one message id, and deltas reassemble the text.
    message_ids = {e.message_id for e in events}
    assert len(message_ids) == 1
    assert events[0].role == "assistant"
    assert events[1].delta + events[2].delta == "Hello"


def test_tool_call_streams_args_then_result() -> None:
    events = _collect(
        [
            _stream({"type": "message_start", "message": {}}),
            _stream(
                {
                    "type": "content_block_start",
                    "index": 0,
                    "content_block": {
                        "type": "tool_use",
                        "id": "toolu_1",
                        "name": "mcp__knowledge__search",
                        "input": {},
                    },
                }
            ),
            _stream(
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "input_json_delta", "partial_json": '{"q":'},
                }
            ),
            _stream(
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "input_json_delta", "partial_json": '"s3"}'},
                }
            ),
            _stream({"type": "content_block_stop", "index": 0}),
            # The SDK injects the MCP tool result as a UserMessage.
            UserMessage(
                content=[ToolResultBlock(tool_use_id="toolu_1", content="found it")]
            ),
        ]
    )

    types = [e.type for e in events]
    assert types == [
        EventType.TOOL_CALL_START,
        EventType.TOOL_CALL_ARGS,
        EventType.TOOL_CALL_ARGS,
        EventType.TOOL_CALL_END,
        EventType.TOOL_CALL_RESULT,
    ]
    assert events[0].tool_call_id == "toolu_1"
    assert events[0].tool_call_name == "mcp__knowledge__search"
    assert events[1].delta + events[2].delta == '{"q":"s3"}'
    assert events[4].tool_call_id == "toolu_1"
    assert events[4].content == "found it"


def test_thinking_block_maps_to_reasoning_events() -> None:
    events = _collect(
        [
            _stream({"type": "message_start", "message": {}}),
            _stream(
                {
                    "type": "content_block_start",
                    "index": 0,
                    "content_block": {"type": "thinking", "thinking": ""},
                }
            ),
            _stream(
                {
                    "type": "content_block_delta",
                    "index": 0,
                    "delta": {"type": "thinking_delta", "thinking": "hmm"},
                }
            ),
            _stream({"type": "content_block_stop", "index": 0}),
        ]
    )

    assert [e.type for e in events] == [
        EventType.REASONING_START,
        EventType.REASONING_MESSAGE_START,
        EventType.REASONING_MESSAGE_CONTENT,
        EventType.REASONING_MESSAGE_END,
        EventType.REASONING_END,
    ]
    assert events[2].delta == "hmm"


def test_failed_result_raises_agent_run_error() -> None:
    messages = [
        ResultMessage(
            subtype="error_during_execution",
            duration_ms=1,
            duration_api_ms=1,
            is_error=True,
            num_turns=1,
            session_id="s",
            errors=["boom"],
        )
    ]
    with pytest.raises(AgentRunError, match="boom"):
        _collect(messages)
