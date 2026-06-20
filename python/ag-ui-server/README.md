# ag-ui-server

A [Claude Agent SDK][claude-agent-sdk] agent exposed over the **[AG-UI][ag-ui]
protocol** and deployed to an Amazon Bedrock **AgentCore Runtime**. It replaces
the previous CopilotKit-on-Hono server: the web frontend
(`@elmethis/qwik` `useAgent` → `@ag-ui/client` `HttpAgent`) is unchanged — it
still POSTs an AG-UI `RunAgentInput` to `/invocations` and consumes an AG-UI SSE
event stream.

A member of the repo-root [uv](https://docs.astral.sh/uv/) workspace
(`members = ["python/*"]`), packaged for the AgentCore Runtime as a `linux/arm64`
container.

```txt
SPA ──POST /invocations (RunAgentInput)──▶ CloudFront ──▶ AgentCore Runtime (AGUI, arm64)
     ◀──── AG-UI SSE event stream ────────             └─ FastAPI /invocations + /ping
                                                            └─ Claude Agent SDK query()
                                                                 ├─ model: Anthropic (subscription OAuth token)
                                                                 └─ tool: AWS Knowledge MCP (https://knowledge-mcp.global.api.aws)
```

The SPA's Cognito JWT is validated by AgentCore's `custom_jwt_authorizer` at the
platform edge (inbound auth), so the container never validates the token itself.

## Modules

| Module           | Responsibility                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `config.py`      | Read runtime configuration from environment variables.                                    |
| `model_auth.py`  | Fetch the subscription OAuth token from SSM; export `CLAUDE_CODE_OAUTH_TOKEN` for the SDK. |
| `agent.py`       | Build the `ClaudeAgentOptions` (model, system prompt, AWS Knowledge MCP, hidden builtins). |
| `prompt.py`      | Render a `RunAgentInput` (full message history) into one prompt for `query()`.            |
| `agui_bridge.py` | Translate the SDK message/stream events into AG-UI events.                                 |
| `server.py`      | FastAPI app: `POST /invocations` (AG-UI SSE) and `GET /ping` (health).                     |

## Environment variables (set by Terraform on the runtime)

| Variable                         | Meaning                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `CLAUDE_CODE_OAUTH_TOKEN_PARAM`  | **Required.** SSM SecureString holding the `claude setup-token` OAuth token.   |
| `CLAUDE_CODE_OAUTH_TOKEN_REGION` | Region the SSM SecureString lives in (default `ap-northeast-1`).               |
| `MODEL_ID`                       | Claude model the agent reasons with (default `claude-sonnet-4-6`).             |
| `MCP_URL`                        | AWS Knowledge MCP endpoint (default `https://knowledge-mcp.global.api.aws`).   |
| `MAX_TURNS`                      | Max agentic turns per invocation (default `20`).                               |

## Model auth (subscription)

The SDK authenticates a **Claude Pro/Max subscription** with a `claude
setup-token` OAuth token, stored as an SSM SecureString and read at startup —
no model credential lives in the image or in plain env vars. Mint the token and
store it under the stage's secret path:

```bash
# Prints the token to the terminal; it is not saved anywhere.
claude setup-token

aws ssm put-parameter --type SecureString \
  --name /dev/46ki75/internal/claude-code/secret --value "<token>" \
  --region ap-northeast-1
```

The token is valid for one year and does not auto-refresh. The runtime reads it
**once at startup**, so rotating it (`put-parameter … --overwrite`) requires a
runtime restart — `terraform apply` with a fresh image `TAG` creates a new
runtime version. (`CLAUDE_CODE_OAUTH_TOKEN` sits below `ANTHROPIC_*` in the CLI's
auth precedence, so `model_auth.py` clears any `ANTHROPIC_*` first.)

## Develop

The lockfile and venv live at the workspace root. From the repo root:

```bash
uv sync --package ag-ui-server --group dev
uv run --package ag-ui-server pytest python/ag-ui-server/tests
```

Tests are hermetic — they mock SSM and the SDK `query()`, so no AWS credentials
or model access is needed.

Run locally (needs the OAuth token reachable in SSM and AWS credentials):

```bash
CLAUDE_CODE_OAUTH_TOKEN_PARAM=/dev/46ki75/internal/claude-code/secret \
  uv run --package ag-ui-server python -m ag_ui_server.server
```

## Build & deploy

```bash
STAGE_NAME=dev python/ag-ui-server/build.sh          # build arm64 + push :latest to dev/ag-ui-server
STAGE_NAME=dev TAG=v2 python/ag-ui-server/build.sh   # push a fresh tag for a new runtime version
```

`build.sh` exports a pinned `requirements.txt` from the workspace lock, logs in
to ECR, and pushes a `linux/arm64` image (the `claude-agent-sdk` wheel bundles a
native `claude` CLI, so the image needs no Node.js). The ECR repo, IAM, the
AgentCore runtime, and the CloudFront `/invocations*` behavior are provisioned by
the shared Terraform stack (`terraform/bedrock-agentcore.tf`). Push the image
first, then `terraform apply`.

On an x86 host, enable arm64 emulation once:
`docker run --privileged --rm tonistiigi/binfmt --install arm64`.

When an apply also changes the execution-role policy (e.g. the first migration to
subscription auth), the new SSM/KMS grant can take a few seconds to propagate. A
container that boots in that window fails its startup SSM read once and is
replaced by AgentCore (the runtime still goes READY on the healthy replicas). To
avoid even that transient blip on `prod`, apply the IAM policy first and let it
settle before the runtime update:

```bash
terraform -chdir=terraform workspace select prod
terraform -chdir=terraform apply -target=aws_iam_policy.bedrock_agentcore_runtime_ag_ui_server
# ...wait ~1 min for IAM to propagate...
terraform -chdir=terraform apply
```

## Notes & limitations

- **Tool isolation** — every Claude Code built-in (shell, file editing, its own
  WebSearch/WebFetch) is hidden via `disallowed_tools`, so the agent can only
  reach the managed AWS Knowledge MCP tools.
- **Frontend-defined tools** — tools sent in `RunAgentInput.tools` are not yet
  forwarded to the SDK (the `/chat` route does not register any). The agent runs
  its own tools (the MCP server) to completion each invocation.
- **Stateless** — the AG-UI client resends the full history every run, so the
  runtime reconstructs the conversation from `RunAgentInput.messages` each time
  rather than persisting session state.

[claude-agent-sdk]: https://github.com/anthropics/claude-agent-sdk-python
[ag-ui]: https://docs.ag-ui.com/
