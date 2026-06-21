# The Claude Agent SDK yields a union of message types and opaque raw stream
# event dicts, so this module opts down to basic type checking.
# pyright: basic
"""Bridge the Claude Agent SDK message stream to AG-UI protocol events.

The SDK's ``query()`` yields a stream of messages. With
``include_partial_messages=True`` it interleaves :class:`StreamEvent` objects
carrying the *raw Anthropic streaming events* (``message_start``,
``content_block_start/delta/stop``, …) with the complete messages. We drive the
AG-UI output entirely off those raw stream events so text, reasoning, and tool
calls forward token-by-token; the complete ``AssistantMessage`` is ignored to
avoid emitting the same text twice. Tool *results* (which only appear in a
complete ``UserMessage`` the SDK injects after running an MCP tool) are forwarded
as ``TOOL_CALL_RESULT``.

Mapping:

- ``text`` block            → ``TEXT_MESSAGE_START`` / ``_CONTENT`` / ``_END``
- ``thinking`` block        → ``REASONING_START`` / ``REASONING_MESSAGE_*`` / ``REASONING_END``
- ``tool_use`` block        → ``TOOL_CALL_START`` / ``_ARGS`` / ``_END``
- ``ToolResultBlock``       → ``TOOL_CALL_RESULT``

``RUN_STARTED`` / ``RUN_FINISHED`` / ``RUN_ERROR`` are emitted by the server
around this translation.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterable, AsyncIterator, Iterator
from typing import Any
from uuid import uuid4

from ag_ui.core import (
    BaseEvent,
    EventType,
    ReasoningEndEvent,
    ReasoningMessageContentEvent,
    ReasoningMessageEndEvent,
    ReasoningMessageStartEvent,
    ReasoningStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    TextMessageStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from claude_agent_sdk import (
    ResultMessage,
    StreamEvent,
    ToolResultBlock,
    UserMessage,
)


class AgentRunError(RuntimeError):
    """Raised when the SDK reports the run failed (``ResultMessage.is_error``)."""


async def translate(messages: AsyncIterable[Any]) -> AsyncIterator[BaseEvent]:
    """Translate an SDK message stream into AG-UI content events.

    Raises :class:`AgentRunError` if the SDK reports a failed run, so the caller
    can surface it as a ``RUN_ERROR`` event.
    """
    # Maps a content-block index (within the current assistant message) to a
    # ``(kind, identifier)`` pair. ``kind`` ∈ {"text", "thinking", "tool"};
    # ``identifier`` is the AG-UI message id (text/thinking) or tool_call id.
    blocks: dict[int, tuple[str, str]] = {}

    async for message in messages:
        if isinstance(message, StreamEvent):
            for event in _translate_stream_event(message.event, blocks):
                yield event
        elif isinstance(message, UserMessage):
            for event in _translate_tool_results(message):
                yield event
        elif isinstance(message, ResultMessage):
            if message.is_error:
                raise AgentRunError(_result_error_message(message))
        # AssistantMessage text already streamed via StreamEvent; SystemMessage
        # and RateLimitEvent are internal bookkeeping — ignore both.


def _translate_stream_event(
    event: dict[str, Any], blocks: dict[int, tuple[str, str]]
) -> Iterator[BaseEvent]:
    """Map one raw Anthropic stream event to zero or more AG-UI events."""
    etype = event.get("type")

    if etype == "message_start":
        # A fresh assistant message restarts block indices at 0.
        blocks.clear()
        return

    if etype == "content_block_start":
        index: int = event["index"]
        block = event.get("content_block") or {}
        block_type = block.get("type")
        if block_type == "text":
            message_id = uuid4().hex
            blocks[index] = ("text", message_id)
            yield TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=message_id,
                role="assistant",
            )
        elif block_type == "thinking":
            message_id = uuid4().hex
            blocks[index] = ("thinking", message_id)
            yield ReasoningStartEvent(
                type=EventType.REASONING_START, message_id=message_id
            )
            yield ReasoningMessageStartEvent(
                type=EventType.REASONING_MESSAGE_START,
                message_id=message_id,
                role="reasoning",
            )
        elif block_type in ("tool_use", "server_tool_use"):
            tool_call_id = block.get("id") or uuid4().hex
            blocks[index] = ("tool", tool_call_id)
            yield ToolCallStartEvent(
                type=EventType.TOOL_CALL_START,
                tool_call_id=tool_call_id,
                tool_call_name=block.get("name") or "",
            )
        return

    if etype == "content_block_delta":
        entry = blocks.get(event["index"])
        if entry is None:
            return
        kind, identifier = entry
        delta = event.get("delta") or {}
        delta_type = delta.get("type")
        if kind == "text" and delta_type == "text_delta":
            text = delta.get("text") or ""
            if text:
                yield TextMessageContentEvent(
                    type=EventType.TEXT_MESSAGE_CONTENT,
                    message_id=identifier,
                    delta=text,
                )
        elif kind == "thinking" and delta_type == "thinking_delta":
            thinking = delta.get("thinking") or ""
            if thinking:
                yield ReasoningMessageContentEvent(
                    type=EventType.REASONING_MESSAGE_CONTENT,
                    message_id=identifier,
                    delta=thinking,
                )
        elif kind == "tool" and delta_type == "input_json_delta":
            partial_json = delta.get("partial_json") or ""
            if partial_json:
                yield ToolCallArgsEvent(
                    type=EventType.TOOL_CALL_ARGS,
                    tool_call_id=identifier,
                    delta=partial_json,
                )
        # signature_delta (thinking signature) and any other delta: ignore.
        return

    if etype == "content_block_stop":
        entry = blocks.pop(event["index"], None)
        if entry is None:
            return
        kind, identifier = entry
        if kind == "text":
            yield TextMessageEndEvent(
                type=EventType.TEXT_MESSAGE_END, message_id=identifier
            )
        elif kind == "thinking":
            yield ReasoningMessageEndEvent(
                type=EventType.REASONING_MESSAGE_END, message_id=identifier
            )
            yield ReasoningEndEvent(type=EventType.REASONING_END, message_id=identifier)
        elif kind == "tool":
            yield ToolCallEndEvent(
                type=EventType.TOOL_CALL_END, tool_call_id=identifier
            )
        return

    # message_delta / message_stop carry stop reasons and usage only — the run's
    # real completion is signalled by ResultMessage, so nothing to emit here.


def _translate_tool_results(message: UserMessage) -> Iterator[BaseEvent]:
    """Forward any tool-result blocks the SDK injected as ``TOOL_CALL_RESULT``."""
    content = message.content
    if not isinstance(content, list):
        return
    for block in content:
        if isinstance(block, ToolResultBlock):
            yield ToolCallResultEvent(
                type=EventType.TOOL_CALL_RESULT,
                message_id=uuid4().hex,
                tool_call_id=block.tool_use_id,
                content=_tool_result_text(block.content),
                role="tool",
            )


def _tool_result_text(content: str | list[dict[str, Any]] | None) -> str:
    """Flatten an MCP tool result into a string for the AG-UI result event."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    parts: list[str] = []
    for item in content:
        if isinstance(item, dict):
            if item.get("type") == "text" and "text" in item:
                parts.append(str(item["text"]))
            else:
                parts.append(json.dumps(item, ensure_ascii=False))
        else:
            parts.append(str(item))
    return "\n".join(parts)


def _result_error_message(message: ResultMessage) -> str:
    if message.errors:
        return "; ".join(str(error) for error in message.errors)
    if message.result:
        return str(message.result)
    status = (
        f" (HTTP {message.api_error_status})"
        if message.api_error_status is not None
        else ""
    )
    return f"agent run failed: {message.subtype}{status}"
