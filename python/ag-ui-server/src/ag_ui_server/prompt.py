# ag_ui.core messages are a discriminated union whose members carry differently
# typed ``content`` fields, so this module opts down to basic type checking.
# pyright: basic
"""Render an AG-UI ``RunAgentInput`` into a single prompt for ``query()``.

The AG-UI client (``@ag-ui/client`` ``HttpAgent``) holds the conversation
client-side and resends the full message history on every run, so the runtime is
stateless: each invocation reconstructs the conversation from
``RunAgentInput.messages``. A single user turn is passed through verbatim; a
multi-turn history is rendered as a transcript the agent is asked to continue.
"""

from __future__ import annotations

from typing import Any

from ag_ui.core import RunAgentInput


def build_prompt(input_data: RunAgentInput) -> str:
    """Build the prompt string for a single stateless ``query()`` call."""
    messages = [m for m in (input_data.messages or []) if _message_text(m).strip()]
    context_block = _context_block(input_data)

    # Single user turn: send it through directly.
    if len(messages) == 1 and messages[0].role == "user":
        return _message_text(messages[0]) + context_block

    transcript = "\n\n".join(
        f"{message.role}: {_message_text(message)}" for message in messages
    )
    return (
        "You are continuing a conversation with a user. Transcript so far:\n\n"
        f"{transcript}{context_block}\n\n"
        "Respond to the most recent user message."
    )


def _context_block(input_data: RunAgentInput) -> str:
    context = input_data.context or []
    if not context:
        return ""
    lines = "\n".join(f"- {item.description}: {item.value}" for item in context)
    return f"\n\nAdditional context provided by the app:\n{lines}"


def _message_text(message: Any) -> str:
    """Extract a plain-text representation of any AG-UI message's content."""
    content = getattr(message, "content", None)
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    # User messages may carry a list of multimodal InputContent items; forward
    # the text parts and note any non-text parts (not yet forwarded to the SDK).
    parts: list[str] = []
    for item in content:
        item_type = getattr(item, "type", None)
        if item_type == "text":
            parts.append(getattr(item, "text", "") or "")
        else:
            parts.append(f"[{item_type} content omitted]")
    return "\n".join(part for part in parts if part)
