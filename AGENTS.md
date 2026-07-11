# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Polyglot monorepo with three independent workspaces and shared Terraform:

- `crates/*` — Rust workspace (`Cargo.toml` at root). Lambda binaries: `http-api`, `feed`, `logs-reporter`.
  The rest are libraries — `http-api-core` (shared error/cache/auth) and one `http-api-<feature>` crate per
  REST router — assembled by the `http-api` binary.
- `packages/*` — pnpm workspace (`pnpm-workspace.yaml`).
- `python/*` — uv workspace (`pyproject.toml` at root). `python/fetch` runs as a containerized Lambda; `python/ag-ui-server` runs as a containerized Bedrock AgentCore runtime.
- `terraform/` — single Terraform stack that provisions all `dev`/`stg`/`prod` infra (CloudFront, API Gateway,
  Lambda, Cognito, DynamoDB, SNS, Route53). State lives in the shared S3 bucket
  `shared-46ki75-internal-s3-bucket-terraform-tfstate`.

Stages are `dev` | `stg` | `prod` and are passed via `STAGE_NAME` (Rust/server) or `VITE_STAGE_NAME` (web).
Domains: `{stage-}internal.46ki75.com` (web) and `api.{stage-}internal.46ki75.com` (API Gateway).
`prod` drops the stage prefix.

## Common commands

### Git hooks (lefthook)

`lefthook.yml` defines a `pre-commit` hook that auto-formats staged files and re-stages the fixes (`stage_fixed`):
`cargo fmt --all` for Rust, Prettier for `packages/web-qwik/src`, and `markdownlint-cli2 --fix` for Markdown.
Hooks install on `pnpm install` (root `prepare` → `lefthook install`). Heavier gates (clippy, tests, typecheck)
stay in CI. Run manually with `pnpm exec lefthook run pre-commit`; bypass once with
`git commit --no-verify`.

### `crates/http-api` (main API Lambda)

The `http-api` binary assembles the per-feature router crates into one Axum app. Per-crate recipes use [`just`](https://github.com/casey/just):

```sh
just dev                  # cargo lambda watch with STAGE_NAME=dev, debug logs
just build                # cargo lambda build --arm64 --release
just deploy <STAGE_NAME>  # cargo lambda deploy to <STAGE_NAME>-46ki75-internal-lambda-function-http-api
```

Workspace-wide gates live in the **root `Justfile`**: `just fmt-check`, `just lint`
(`clippy --workspace -D warnings`), `just test` (`cargo test --workspace`), and `just ci` (all three).
Run a single test with `cargo test -p <crate> <test_name>` — most feature tests live in their own
`http-api-<feature>` crate, not the binary. When `cargo lambda watch` is running, the local URL is
`http://localhost:9000/lambda-url/http-api/...`.

### `crates/logs-reporter` (CloudWatch Logs → SNS)

Same per-crate `just` recipes as `http-api`; deploys to `<STAGE_NAME>-46ki75-internal-lambda-function-reporter`.

### `crates/feed`

No `Justfile`. Use `cargo lambda build --release` / `cargo lambda deploy` directly.

### `packages/web-qwik` (Qwik City frontend)

```sh
pnpm dev                  # VITE_STAGE_NAME=dev vite --mode ssr
pnpm build                # qwik build (typechecks, client+SSR+SSG via adapters/static)
pnpm build.types          # tsc --noEmit (typecheck only)
pnpm lint                 # eslint src/**/*.ts*
pnpm fmt / pnpm fmt.check # prettier
pnpm storybook            # dev on :11071
pnpm deploy.{dev|stg|prod}  # build → s3 sync → CloudFront invalidate
pnpm generate:openapi     # regenerate src/openapi/schema.ts from a running http-api
```

`generate:openapi` requires `crates/http-api` running locally (`just dev` in that crate). It hits
`http://localhost:9000/lambda-url/http-api/api-gateway/api/v1/openapi.json`. Re-run whenever the Rust API
surface changes.

`pnpm deploy.*` runs `scripts/deploy-s3.sh` (S3 sync to `<stage>-46ki75-internal-s3-bucket-web`) then `scripts/invalidate.sh` (looks up the CloudFront distribution by alias domain).

### `python/ag-ui-server` (Claude Agent SDK over AG-UI, deployed to Bedrock AgentCore)

A FastAPI app (uv workspace member) that runs a [Claude Agent SDK][casdk] agent and exposes it over the
**AG-UI protocol**. Replaces the former CopilotKit-on-Hono server; the web frontend
(`@elmethis/qwik` `useAgent` → `@ag-ui/client`) is unchanged.

```sh
uv sync --package ag-ui-server --group dev
uv run --package ag-ui-server pytest python/ag-ui-server/tests   # hermetic (mocks SSM + the SDK)
STAGE_NAME=dev python/ag-ui-server/build.sh                      # build arm64 + push to <stage>/ag-ui-server ECR
```

Serves the AgentCore `AGUI` contract: `POST /invocations` (AG-UI `RunAgentInput` → AG-UI SSE) and
`GET /ping` (health). The model is authenticated with a **Claude Pro/Max subscription**
`claude setup-token` OAuth token read from SSM at `/<stage>/46ki75/internal/claude-code/secret`
(no Bedrock model invocation); the only tool is the public AWS Knowledge MCP server. AgentCore validates
the Cognito JWT at the edge. After pushing a new image, `terraform apply` (with a fresh `TAG` for a new
runtime version). See `python/ag-ui-server/README.md`.

[casdk]: https://github.com/anthropics/claude-agent-sdk-python

### `python/fetch`

Containerized `crawl4ai` Lambda. Build with `python/fetch/build.sh`. Local prereqs are listed in `python/fetch/README.md`.

### Terraform

Operates against the shared remote state in `shared-46ki75-internal-s3-bucket-terraform-tfstate`.
See `terraform/README.md` for the list of **manually managed resources** that Terraform expects to exist
(Parameter Store secrets, Route53 zones, SNS email subscription approval). Don't recreate those in code.

## Architecture

### `crates/http-api` — Axum + Lambda REST API (multi-crate)

The REST API is split across the workspace and assembled into one Lambda binary:

- **`http-api`** — the binary. `src/router.rs::init_router` builds the Axum app; `src/execute.rs` adapts
  `lambda_http::Request` ↔ Axum. `src/lib.rs` re-exports each feature crate under its short name
  (`pub use http_api_bookmark as bookmark;`) so `crate::<feature>::…` paths — and
  `http_api::<feature>::…` in `tests/` — keep resolving.
- **`http-api-core`** — shared infrastructure, the only intra-workspace dependency of the feature crates:
  `error::Error` (crate-wide error + `render_error_response`), `cache` (memoized AWS/Notion clients and
  `get_parameter` SSM reads via the `cached` crate), and `layer` (Axum middleware).
- **`http-api-<feature>`** — one library crate per REST router (`anki`, `bookmark`, `icon`, `image`, `to-do`,
  `trivia`, `typing`). Independent of each other (no feature→feature deps), each with a strict layered
  layout:

```text
crates/http-api-<feature>/src/
  controller/   REST handlers + utoipa-axum router (controller/router.rs::init_<feature>_router)
  use_case/     business logic (no I/O, depends on repository trait)
  repository/   I/O (Notion, DynamoDB, AWS SDKs); concrete `*RepositoryImpl`
```

`src/router.rs::init_router` merges each feature's REST `OpenApiRouter`, mounts Swagger UI at
`/api-gateway/api/v1/swagger-ui`, exposes OpenAPI JSON at `/api-gateway/api/v1/openapi.json`, registers
`/api-gateway/api/health`, and wraps everything in gzip/br compression. The whole router is cached in a
`OnceCell` so Lambda cold starts only build it once.

To add a feature: create an `http-api-<feature>` crate (depend on `http-api-core`, expose
`init_<feature>_router`), then wire it into the binary in three places — a path dep in
`crates/http-api/Cargo.toml`, a `pub use http_api_<feature> as <feature>;` in `src/lib.rs`, and a
`.merge(...)` in `src/router.rs::init_router`.

Feature crates read their per-feature SSM keys inline via `http_api_core::cache::get_parameter`
(no per-feature wrapper). External integrations: `notionrs` / `n2a2ui` (Notion content → A2UI), AWS SDKs
(DynamoDB, SSM, Cognito), and `html-meta-scraper` (bookmarks).

### `packages/web-qwik` — Qwik City SSG

- `src/routes/` — file-based routing (Qwik City). `layout.tsx` is the top-level shell (header + auth modal). Routes: `/`, `/anki`, `/chat`, `/icon`, `/swatch`.
- `src/components/` — feature components grouped by domain (`bookmark/`, `todo/`, `common/`, `icon/`).
- `src/container/` — page-level containers that compose components and talk to the API.
- `src/context/` — Qwik contexts (`auth-context.tsx` wraps Cognito via `aws-amplify`; `anki-context.tsx` for Anki feature state).
- `src/openapi/schema.ts` — generated from `http-api`'s OpenAPI; do not edit by hand. Consumed via `openapi-fetch`.
- Build target is SSG (`adapters/static`); output in `dist/` is uploaded to S3 and served via CloudFront. Long-cache the hashed `build/**/*.js` files (handled by CloudFront config).

### Auth and config

- Cognito user pool is the single auth surface. The login password and Notion/GitHub/DeepL secrets are stored
  as Parameter Store entries listed in `terraform/README.md` — these are **not** managed by Terraform and
  must exist before deploy.
- Lambda env vars are populated from Parameter Store at Terraform apply time; runtime code reads them via `std::env::var`.

### Logging

Rust crates use `tracing` + `tracing-subscriber`. `RUST_LOG` controls level;
`RUST_LOG_FORMAT=json|pretty` switches between human-readable (default) and JSON (used in deployed Lambdas).
Each `http-api` feature logs under its own `http_api_<feature>` target (plus `http_api_core`), so `RUST_LOG`
filters must list them all — see the `http-api` `Justfile` and `terraform/lambda.tf`.
`logs-reporter` subscribes to CloudWatch Logs and forwards filtered events to SNS for email alerting.
