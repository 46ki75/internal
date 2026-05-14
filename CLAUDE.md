# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Polyglot monorepo with three independent workspaces and shared Terraform:

- `crates/*` — Rust workspace (`Cargo.toml` at root). Each crate is its own AWS Lambda binary.
- `packages/*` — pnpm workspace (`pnpm-workspace.yaml`).
- `python/*` — uv workspace (`pyproject.toml` at root). `python/fetch` runs as a containerized Lambda.
- `terraform/` — single Terraform stack that provisions all `dev`/`stg`/`prod` infra (CloudFront, API Gateway, Lambda, Cognito, DynamoDB, SNS, Route53). State lives in the shared S3 bucket `shared-46ki75-internal-s3-bucket-terraform-tfstate`.

Stages are `dev` | `stg` | `prod` and are passed via `STAGE_NAME` (Rust/server) or `VITE_STAGE_NAME` (web). Domains: `{stage-}internal.46ki75.com` (web) and `api.{stage-}internal.46ki75.com` (API Gateway). `prod` drops the stage prefix.

## Common commands

### `crates/http_api` (main API Lambda)

Uses [`just`](https://github.com/casey/just):

```
just dev                  # cargo lambda watch with STAGE_NAME=dev, debug logs
just test                 # cargo test --lib
just build                # cargo lambda build --arm64 --release
just deploy <STAGE_NAME>  # cargo lambda deploy to <STAGE_NAME>-46ki75-internal-lambda-function-http-api
```

To run a single test: `cargo test --lib --package http-api <test_name>`. When `cargo lambda watch` is running, the local URL is `http://localhost:9000/lambda-url/http-api/...`.

### `crates/logs-reporter` (CloudWatch Logs → SNS)

Same `just` recipes as `http_api`; deploys to `<STAGE_NAME>-46ki75-internal-lambda-function-reporter`.

### `crates/feed`

No `Justfile`. Use `cargo lambda build --release` / `cargo lambda deploy` directly.

### `packages/web-qwik` (Qwik City frontend)

```
pnpm dev                  # VITE_STAGE_NAME=dev vite --mode ssr
pnpm build                # qwik build (typechecks, client+SSR+SSG via adapters/static)
pnpm build.types          # tsc --noEmit (typecheck only)
pnpm lint                 # eslint src/**/*.ts*
pnpm fmt / pnpm fmt.check # prettier
pnpm storybook            # dev on :11071
pnpm deploy.{dev|stg|prod}  # build → s3 sync → CloudFront invalidate
pnpm generate:openapi     # regenerate src/openapi/schema.ts from a running http-api
```

`generate:openapi` requires `crates/http_api` running locally (`just dev` in that crate) — it hits `http://localhost:9000/lambda-url/http-api/api-gateway/api/v1/openapi.json`. Re-run whenever the Rust API surface changes.

`pnpm deploy.*` runs `scripts/deploy-s3.sh` (S3 sync to `<stage>-46ki75-internal-s3-bucket-web`) then `scripts/invalidate.sh` (looks up the CloudFront distribution by alias domain).

### `packages/ag-ui-server` (CopilotKit on Hono, deployed to Bedrock AgentCore)

```
pnpm dev                       # node --env-file=.env --watch src/server.ts
pnpm build                     # esbuild bundle to dist/server.mjs (build.ts)
pnpm build.container.{dev|stg|prod}  # docker buildx for linux/arm64
```

The container exposes both the standard CopilotKit routes under `/copilotkit/builtin` and a `/invocations` shim that Bedrock AgentCore calls — the shim rewrites the URL to target the `default` agent.

### `python/fetch`

Containerized `crawl4ai` Lambda. Build with `python/fetch/build.sh`. Local prereqs are listed in `python/fetch/README.md`.

### Terraform

Operates against the shared remote state in `shared-46ki75-internal-s3-bucket-terraform-tfstate`. See `terraform/README.md` for the list of **manually managed resources** that Terraform expects to exist (Parameter Store secrets, Route53 zones, SNS email subscription approval). Don't recreate those in code.

## Architecture

### `crates/http_api` — Axum + Lambda, serves REST and GraphQL

Single Lambda binary running Axum over `lambda_http`. Each feature module (`anki`, `bookmark`, `to_do`, `icon`, `image`, `typing`, `tts`) follows a strict layered layout:

```
src/<feature>/
  controller/   REST handlers + utoipa-axum router (e.g. controller/router.rs::init_<feature>_router)
  resolver/     async-graphql Query/Mutation resolvers
  use_case/     business logic (no I/O, depends on repository trait)
  repository/   I/O (Notion, DynamoDB, AWS SDKs); concrete `*RepositoryImpl`
```

Two assembly points wire features together:

- `src/router.rs::init_router` — builds the Axum app: merges each feature's REST `OpenApiRouter`, mounts Swagger UI at `/api-gateway/api/v1/swagger-ui`, exposes OpenAPI JSON at `/api-gateway/api/v1/openapi.json`, registers `/api-gateway/api/graphql` and `/api-gateway/api/health`, and wraps everything in gzip/br compression. The whole router is cached in a `OnceCell` so Lambda cold starts only build it once.
- `src/schema.rs::try_init_schema` — builds the async-graphql `Schema` and injects per-feature `UseCase`s as `.data(...)`. Resolvers retrieve them via `ctx.data::<Arc<XxxUseCase>>()`.

When adding a feature, both REST (`init_router`) and GraphQL (`try_init_schema`) need the new use_case wired up — they share the same use_case/repository layer.

`src/cache.rs` provides shared caching via the `cached` crate. `src/error.rs` is the crate-wide error type. `src/execute.rs` adapts `lambda_http::Request` ↔ Axum.

External integrations live in `notionrs` / `notion-to-jarkup` (Notion content), AWS SDKs (DynamoDB, SSM, Cognito), and `html-meta-scraper` (bookmarks).

### `packages/web-qwik` — Qwik City SSG

- `src/routes/` — file-based routing (Qwik City). `layout.tsx` is the top-level shell (header + auth modal). Routes: `/`, `/anki`, `/chat`, `/icon`, `/swatch`.
- `src/components/` — feature components grouped by domain (`bookmark/`, `todo/`, `common/`, `icon/`).
- `src/container/` — page-level containers that compose components and talk to the API.
- `src/context/` — Qwik contexts (`auth-context.tsx` wraps Cognito via `aws-amplify`; `anki-context.tsx` for Anki feature state).
- `src/openapi/schema.ts` — generated from `http_api`'s OpenAPI; do not edit by hand. Consumed via `openapi-fetch`.
- Build target is SSG (`adapters/static`); output in `dist/` is uploaded to S3 and served via CloudFront. Long-cache the hashed `build/**/*.js` files (handled by CloudFront config).

### Auth and config

- Cognito user pool is the single auth surface. The login password and Notion/GitHub/DeepL secrets are stored as Parameter Store entries listed in `terraform/README.md` — these are **not** managed by Terraform and must exist before deploy.
- Lambda env vars are populated from Parameter Store at Terraform apply time; runtime code reads them via `std::env::var`.

### Logging

Rust crates use `tracing` + `tracing-subscriber`. `RUST_LOG` controls level; `RUST_LOG_FORMAT=json|pretty` switches between human-readable (default) and JSON (used in deployed Lambdas). `logs-reporter` subscribes to CloudWatch Logs and forwards filtered events to SNS for email alerting.
