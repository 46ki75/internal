"""AG-UI server: a Claude Agent SDK agent exposed over the AG-UI protocol.

Serves the HTTP contract Amazon Bedrock AgentCore expects from an ``AGUI``
runtime: ``POST /invocations`` accepts an AG-UI ``RunAgentInput`` and streams an
SSE event stream back; ``GET /ping`` is the health check. A plain ASGI app is a
fully compliant AgentCore container — no ``bedrock-agentcore`` SDK is needed, and
since the model is authenticated with a subscription OAuth token and the only
tool is a public MCP server, no AgentCore Gateway/Identity is required either.
"""

from __future__ import annotations

import logging
import os
import time
from collections.abc import AsyncGenerator, AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from uuid import NAMESPACE_URL, uuid5

from ag_ui.core import (
    EventType,
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
)
from ag_ui.encoder import EventEncoder
from claude_agent_sdk import query
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .agent import build_agent_options
from .agui_bridge import translate
from .config import Config
from .model_auth import configure_sdk_env, fetch_oauth_token
from .prompt import build_latest_user_prompt, build_prompt
from .session_store import DynamoDBSessionStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fixed namespace for deriving a stable per-thread SDK session id (a valid UUID)
# from the AG-UI ``thread_id``, so the same conversation always resumes itself.
_THREAD_NS = uuid5(NAMESPACE_URL, "46ki75/internal/ag-ui-server/thread")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Load config and authenticate the SDK once at startup.

    The OAuth token is read from SSM and exported before the first ``query()``,
    so the SDK's bundled CLI picks it up when it spawns. Rotating the token
    requires a runtime restart (a new AgentCore runtime version).
    """
    config = Config.from_env()
    configure_sdk_env(fetch_oauth_token(config))
    app.state.config = config
    app.state.session_store = (
        DynamoDBSessionStore(
            config.session_table_name, region=config.session_table_region
        )
        if config.session_table_name
        else None
    )
    logger.info(
        "ag-ui-server ready (model=%s, mcp=%s, sessions=%s)",
        config.model_id,
        config.mcp_url,
        config.session_table_name or "disabled",
    )
    yield


app = FastAPI(title="ag-ui-server", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
async def ping() -> JSONResponse:
    """AgentCore health check: report Healthy with a fresh update timestamp."""
    return JSONResponse({"status": "Healthy", "time_of_last_update": int(time.time())})


def _plan_run(
    config: Config,
    store: DynamoDBSessionStore | None,
    input_data: RunAgentInput,
) -> tuple[Any, str]:
    """Choose the SDK options and prompt for one run.

    Stateless (no store): replay the whole client-held transcript. Stateful: key
    a stable session id off ``thread_id`` and either create it (first turn) or
    resume it (once the client echoes a prior assistant turn), sending only the
    newest user message so resumed history isn't duplicated.
    """
    if store is None:
        return build_agent_options(config), build_prompt(input_data)

    session_id = str(uuid5(_THREAD_NS, input_data.thread_id))
    resuming = any(
        getattr(message, "role", None) == "assistant"
        for message in (input_data.messages or [])
    )
    if resuming:
        options = build_agent_options(config, session_store=store, resume=session_id)
        return options, build_latest_user_prompt(input_data)
    options = build_agent_options(config, session_store=store, session_id=session_id)
    return options, build_prompt(input_data)


@app.post("/invocations")
async def invocations(input_data: RunAgentInput, request: Request) -> StreamingResponse:
    """Run the agent for one AG-UI run and stream the result as SSE events."""
    config: Config = request.app.state.config
    store: DynamoDBSessionStore | None = request.app.state.session_store
    encoder = EventEncoder(accept=request.headers.get("accept") or "")

    async def event_generator() -> AsyncIterator[str]:
        yield encoder.encode(
            RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id,
            )
        )
        try:
            options, prompt = _plan_run(config, store, input_data)
            async for event in translate(query(prompt=prompt, options=options)):
                yield encoder.encode(event)
            yield encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id,
                )
            )
        except Exception as error:  # noqa: BLE001 — surface any failure in-band
            logger.exception("agent run failed")
            yield encoder.encode(
                RunErrorEvent(type=EventType.RUN_ERROR, message=str(error))
            )

    return StreamingResponse(event_generator(), media_type=encoder.get_content_type())


def main() -> None:
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    host = os.environ.get("ADDRESS", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
