"""Tests for rendering RunAgentInput into a query() prompt."""

from __future__ import annotations

from ag_ui.core import AssistantMessage, Context, RunAgentInput, UserMessage

from ag_ui_server.prompt import build_prompt


def _input(messages: list, context: list | None = None) -> RunAgentInput:
    return RunAgentInput(
        thread_id="t",
        run_id="r",
        state={},
        messages=messages,
        tools=[],
        context=context or [],
        forwarded_props={},
    )


def test_single_user_turn_is_passed_through() -> None:
    prompt = build_prompt(
        _input([UserMessage(id="1", role="user", content="What is Amazon S3?")])
    )
    assert prompt == "What is Amazon S3?"


def test_context_is_appended() -> None:
    prompt = build_prompt(
        _input(
            [UserMessage(id="1", role="user", content="Hi")],
            context=[Context(description="locale", value="ja-JP")],
        )
    )
    assert "Hi" in prompt
    assert "locale: ja-JP" in prompt


def test_multi_turn_renders_transcript() -> None:
    prompt = build_prompt(
        _input(
            [
                UserMessage(id="1", role="user", content="First question"),
                AssistantMessage(id="2", role="assistant", content="First answer"),
                UserMessage(id="3", role="user", content="Follow-up"),
            ]
        )
    )
    assert "user: First question" in prompt
    assert "assistant: First answer" in prompt
    assert "user: Follow-up" in prompt
    assert "Respond to the most recent user message." in prompt
