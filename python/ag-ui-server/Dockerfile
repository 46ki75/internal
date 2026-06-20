# Amazon Bedrock AgentCore Runtime requires linux/arm64 images.
FROM --platform=linux/arm64 python:3.13-slim

# The Claude Agent SDK runs its bundled CLI as a subprocess; ca-certificates lets
# that CLI's TLS reach the Anthropic model endpoint (the Python deps bundle their
# own certifi).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_LINK_MODE=copy \
    # The bundled CLI needs a writable HOME / config dir at runtime.
    HOME=/app \
    CLAUDE_CONFIG_DIR=/app/.claude \
    # Keep the runtime hermetic: no telemetry, error reporting, or auto-update
    # traffic from the CLI — it should only ever reach the Anthropic model
    # endpoint and the public MCP server.
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
    DISABLE_AUTOUPDATER=1

# requirements.txt is exported from the workspace lock by build.sh, so the image
# is reproducible without shipping the whole workspace into the build. The
# claude-agent-sdk wheel bundles a platform-native `claude` CLI, so no Node.js is
# needed in the image.
COPY requirements.txt ./
RUN uv pip install --system --no-cache -r requirements.txt

# Install the agent package itself; its dependencies are already satisfied above.
COPY README.md pyproject.toml ./
COPY src ./src
RUN uv pip install --system --no-cache --no-deps .

EXPOSE 8080

# Serves the AGUI protocol on /invocations and the health check on /ping (8080).
CMD ["python", "-m", "ag_ui_server.server"]
