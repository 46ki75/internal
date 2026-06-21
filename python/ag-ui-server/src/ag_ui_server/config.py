"""Runtime configuration, loaded from environment variables set on the runtime."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    """Everything the agent needs to reach a model provider and the MCP server."""

    # SSM SecureString holding the ``claude setup-token`` OAuth token that
    # authenticates the Claude Agent SDK against a Claude Pro/Max subscription.
    oauth_token_param: str
    # Region the SSM SecureString lives in. Defaults to the stack's region.
    oauth_token_region: str
    # Claude model id the agent reasons with (subscription auth ⇒ Claude only).
    model_id: str
    # AWS Knowledge MCP server endpoint (public, no auth) the agent searches.
    mcp_url: str
    # Upper bound on agentic turns (tool calls + final answer) per invocation.
    max_turns: int
    # DynamoDB table that mirrors SDK session transcripts. When unset, the
    # runtime stays stateless (client-replayed history); when set, sessions are
    # persisted and resumed server-side. See ``session_store.py``.
    session_table_name: str | None
    # Region the session table lives in. Defaults to boto3's resolved region.
    session_table_region: str | None

    @classmethod
    def from_env(cls) -> Config:
        return cls(
            oauth_token_param=_require("CLAUDE_CODE_OAUTH_TOKEN_PARAM"),
            oauth_token_region=os.environ.get(
                "CLAUDE_CODE_OAUTH_TOKEN_REGION", "ap-northeast-1"
            ),
            model_id=os.environ.get("MODEL_ID", "claude-sonnet-4-6"),
            mcp_url=os.environ.get("MCP_URL", "https://knowledge-mcp.global.api.aws"),
            max_turns=int(os.environ.get("MAX_TURNS", "20")),
            session_table_name=os.environ.get("SESSION_TABLE_NAME") or None,
            session_table_region=os.environ.get("SESSION_TABLE_REGION") or None,
        )


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"required environment variable {name!r} is not set")
    return value
