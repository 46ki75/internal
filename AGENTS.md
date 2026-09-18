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

Read [README.md](README.md) for mise setup and the task catalog before making
changes. Root `mise.toml` is the task entry point; use namespaced component tasks
from any directory. Exact tool versions are managed by mise, while rustup reads
`rust-toolchain.toml` natively. These rules supersede older Just examples in the
bundled development-standards skill.

### Git hooks (lefthook)

`lefthook.yml` directly configures the native project tools:

- `mise run fmt` formats tracked files with Cargo/rustfmt, Ruff, Prettier, Terraform, and the existing Markdown fixer.
- `mise run fmt-check` checks the same scope without modifying source files.
- `mise run lint` runs Clippy, Ruff, ESLint, Stylelint, and markdownlint without fixes.
- `mise run check` runs both read-only hooks over all tracked files, plus TypeScript and Python type checking. Tests remain separate.

The first three commands accept repeated `--file <repo-relative-path>` options, including explicit untracked files, or `--all-files`.
`check` is always project-wide; nested hooks do not inherit outer file arguments. Selecting one Rust file still triggers workspace-wide Cargo formatting or Clippy.
Use the full gate after changes to shared configuration or dependencies. Generated OpenAPI code and the web package's ignored spec files are excluded from formatting.
Markdown retains `markdownlint-cli2 --fix`; unfixable Markdown rules can fail formatting, and its read-only check participates in both `lint` and `fmt-check`.

Use `mise run setup` to install locked Node and Python workspace dependencies and native Rust components.
Mise supplies Terraform and binds uv to its Python; hook commands use the existing locked uv environment without syncing it.
The `pre-commit` hook auto-formats staged Rust, web, and Markdown files and re-stages fixes (`stage_fixed`).
Hooks install on `pnpm install` (root `prepare` → `lefthook install`). Run manually with
`mise exec -- pnpm exec lefthook run pre-commit`; bypass once with `git commit --no-verify`.

### `crates/http-api` (main API Lambda)

The `http-api` binary assembles the per-feature router crates into one Axum app:

```sh
mise run http-api:dev             # watch with STAGE_NAME=dev and debug logs
mise run http-api:build           # cargo lambda build --arm64 --release
mise run http-api:deploy <stage>  # build and deploy the stage's API Lambda
```

Workspace-wide Rust gates live in **root `mise.toml`**: `mise run rust:fmt-check`,
`mise run rust:lint`, `mise run rust:test`, and `mise run rust:ci` (all three).
Run a single test with `cargo test -p <crate> <test_name>` — most feature tests live in their own
`http-api-<feature>` crate, not the binary. When `cargo lambda watch` is running, the local URL is
`http://localhost:9000/lambda-url/http-api/...`.

### `crates/logs-reporter` (CloudWatch Logs → SNS)

Use `mise run logs-reporter:dev`, `logs-reporter:build`, `logs-reporter:test`, or
`logs-reporter:deploy <stage>`; deployment targets `<stage>-46ki75-internal-lambda-function-reporter`.

### `crates/feed`

Use `mise exec -- cargo lambda build --release` / `mise exec -- cargo lambda deploy`
from the crate directory.

### `packages/web-solid` (SolidStart frontend)

```sh
mise run web:dev               # VITE_STAGE_NAME=dev Vite dev server on :11070
mise run web:build             # SolidStart v2/Vite CSR bundle into .output/public
mise run web:check             # lint, types, formatting, and tests
mise run web:test              # Vitest component and model tests
mise run web:storybook         # dev on :11071
mise run web:deploy <stage>    # build → s3 sync → CloudFront invalidate
mise run web:generate-openapi  # regenerate schema.ts from a running http-api
```

`web:generate-openapi` requires `crates/http-api` running locally (`mise run http-api:dev`). It hits
`http://localhost:9000/lambda-url/http-api/api-gateway/api/v1/openapi.json`. Re-run whenever the Rust API
surface changes.

`web:deploy` runs `scripts/deploy-s3.sh` (S3 sync to `<stage>-46ki75-internal-s3-bucket-web`) then `scripts/invalidate.sh` (looks up the CloudFront distribution by alias domain).

### `python/ag-ui-server` (Claude Agent SDK over AG-UI, deployed to Bedrock AgentCore)

A FastAPI app (uv workspace member) that runs a [Claude Agent SDK][casdk] agent and exposes it over the
**AG-UI protocol**. Replaces the former CopilotKit-on-Hono server; the web frontend
(`@ag-ui/client` `HttpAgent`) still uses the same AG-UI contract.

```sh
mise run setup:python
mise run ag-ui-server:test             # hermetic (mocks SSM + the SDK)
mise run ag-ui-server:build dev        # build arm64 + push to dev/ag-ui-server ECR
mise run ag-ui-server:deploy dev       # build/push, then interactive Terraform apply
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

`src/router.rs::init_router` merges each feature's REST `OpenApiRouter`, mounts Scalar at
`/api-gateway/api/v1/scalar`, exposes OpenAPI JSON at `/api-gateway/api/v1/openapi.json`, registers
`/api-gateway/api/health`, and wraps everything in gzip/br compression. The whole router is cached in a
`OnceCell` so Lambda cold starts only build it once.

To add a feature: create an `http-api-<feature>` crate (depend on `http-api-core`, expose
`init_<feature>_router`), then wire it into the binary in three places — a path dep in
`crates/http-api/Cargo.toml`, a `pub use http_api_<feature> as <feature>;` in `src/lib.rs`, and a
`.merge(...)` in `src/router.rs::init_router`.

Feature crates read their per-feature SSM keys inline via `http_api_core::cache::get_parameter`
(no per-feature wrapper). External integrations: `notionrs` / `n2a2ui` (Notion content → A2UI), AWS SDKs
(DynamoDB, SSM, Cognito), and `html-meta-scraper` (bookmarks).

### `packages/web-solid` — SolidStart CSR

- `src/app.tsx` — SolidStart router root and persistent auth/Anki provider shell.
- `src/routes/` — SolidStart file routes. Routes: `/`, `/anki`, `/chat`, `/icon`, `/swatch`, `/trivia`.
- `src/components/` — feature components grouped by domain (`bookmark/`, `todo/`, `common/`, `icon/`).
- `src/container/` — stateful feature containers that compose testable components and talk to the API.
- `src/context/` — Solid contexts (`auth-context.tsx` wraps Cognito via `aws-amplify`; `anki-context.tsx` owns Anki state and actions).
- `src/openapi/schema.ts` — generated from `http-api`'s OpenAPI; do not edit by hand. Consumed via `openapi-fetch`.
- SSR is disabled. Nitro prerenders a browser-rendered app into `.output/public/`, which is
  uploaded to S3 and served via CloudFront. Extensionless paths are rewritten to `/index.html`; hashed
  assets live under `_build/`.
- For theme-dependent CSS colors and images, use native `light-dark()` values instead of
  `[data-theme="dark"]` selector overrides; Elmethis keeps the root `color-scheme` in sync.

### Auth and config

- Cognito user pool is the single auth surface. The login password and Notion/GitHub/DeepL secrets are stored
  as Parameter Store entries listed in `terraform/README.md` — these are **not** managed by Terraform and
  must exist before deploy.
- Lambda env vars are populated from Parameter Store at Terraform apply time; runtime code reads them via `std::env::var`.

### Logging

Rust crates use `tracing` + `tracing-subscriber`. `RUST_LOG` controls level;
`RUST_LOG_FORMAT=json|pretty` switches between human-readable (default) and JSON (used in deployed Lambdas).
Each `http-api` feature logs under its own `http_api_<feature>` target (plus `http_api_core`), so `RUST_LOG`
filters must list them all — see `http-api:dev` in `mise.toml` and `terraform/lambda.tf`.
`logs-reporter` subscribes to CloudWatch Logs and forwards filtered events to SNS for email alerting.
