# claude_agent_sdk ships TypedDict configs that pyright strict flags on plain
# dict literals, so this module opts down to basic type checking.
# pyright: basic
"""Build the Claude Agent SDK options for the AG-UI agent.

A single agent reasons with ``model_id`` and is restricted to the public AWS
Knowledge MCP server's tools. Every Claude Code built-in (shell, file editing,
its own web search/fetch) is hidden so the agent can only ever reach the managed
Knowledge MCP — never run a shell or search the web any other way.
"""

from __future__ import annotations

from claude_agent_sdk import ClaudeAgentOptions

from .config import Config

# Name we register the MCP server under; the SDK namespaces its tools as
# ``mcp__<server>__<tool>``.
MCP_SERVER_NAME = "knowledge"

# Allow every tool on the Knowledge MCP server with the server-scoped pattern so
# we don't depend on the exact, brittle tool names the server advertises.
KNOWLEDGE_TOOLS = f"mcp__{MCP_SERVER_NAME}"

# The Claude Agent SDK exposes Claude Code's built-in tools by default. Hide them
# all so the agent can only call the managed Knowledge MCP tools — never the
# bundled WebSearch/WebFetch, a shell, or the filesystem.
HIDDEN_BUILTINS = [
    "WebSearch",
    "WebFetch",
    "Bash",
    "BashOutput",
    "KillShell",
    "Read",
    "Write",
    "Edit",
    "MultiEdit",
    "NotebookEdit",
    "Glob",
    "Grep",
    "TodoWrite",
    "Task",
    "ExitPlanMode",
]

SYSTEM_PROMPT = """You are a helpful assistant for the 46ki75 internal app.
You have access to the AWS Knowledge MCP server — use it to ground answers about
AWS services, APIs, and recent announcements in authoritative, current sources
rather than answering from memory. Prefer a small number of focused searches.
When you use search results, cite the source URL inline as [title](url).
"""


def build_agent_options(config: Config) -> ClaudeAgentOptions:
    """Assemble the single-agent configuration as Claude Agent SDK options.

    ``include_partial_messages`` is enabled so the agent's text and tool calls
    stream token-by-token, which the AG-UI bridge forwards as incremental events.
    """
    return ClaudeAgentOptions(
        model=config.model_id,
        system_prompt=SYSTEM_PROMPT,
        mcp_servers={
            MCP_SERVER_NAME: {
                "type": "http",
                "url": config.mcp_url,
            }
        },
        # The agent may use the Knowledge MCP tools; everything else is hidden.
        allowed_tools=[KNOWLEDGE_TOOLS],
        disallowed_tools=HIDDEN_BUILTINS,
        # No on-disk CLAUDE.md / settings exist in the container, but pin to none
        # so the agent stays hermetic regardless of the filesystem.
        setting_sources=[],
        # Enough turns for several searches plus the final answer.
        max_turns=config.max_turns,
        # Stream partial assistant/tool deltas (raw Anthropic stream events) so
        # the bridge can emit incremental AG-UI events.
        include_partial_messages=True,
    )
