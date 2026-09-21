# Notion HTTP API

Standalone Nitro 2 (`nitropack`) API deployed as a Node.js 24 arm64 Lambda.
Uses the official `@notionhq/client` SDK with Notion API `2026-03-11` and npm
`n2a2ui` for A2UI v0.9 surfaces. Read the root [README](../../README.md) and
[repository rules](../../AGENTS.md) before making changes.

## Development

```sh
mise run setup:node
mise run nitro-api:dev
mise run nitro-api:test
mise run nitro-api:test:lambda
mise run nitro-api:check
```

The development server listens on port 11072 with `STAGE_NAME=dev`; local URLs
start with `/api-gateway/api/`. API Gateway adds this named-stage prefix to Lambda
events, while public URLs start with `/api/`. Route files
live under `server/api/v1`; feature services own business logic, and
`server/lib/notion.ts` owns SDK calls. `server/contracts.ts` supplies request
validation, response types, and OpenAPI schemas.

SSM parameters are loaded lazily and cached per Lambda execution environment:

- `/<stage>/46ki75/internal/notion/secret`
- `/<stage>/46ki75/internal/notion/<feature>/data_source/id`, where feature is
  `anki`, `trivia`, `bookmark`, `todo`, `image`, or `image_tag`.

The icon endpoint uses the workspace custom-emoji API. The converter enables
unsupported blocks, image metadata, and bookmark metadata, matching the previous
Rust implementation. Anki splits surfaces at H1 markers `front`, `back`, and
`explanation`. Every returned surface has root ID `root`.

## Tests

Vitest runs in Node. The default suite uses the real official SDK and converter
with mocked HTTP responses. It covers pagination, property mapping, A2UI section
behavior, request validation, and each HTTP contract. The Lambda suite imports
the built `.output/server/index.mjs` and exercises API Gateway v2 events.

```sh
mise run nitro-api:test:live
```

Live tests require AWS credentials and run only against `dev`. They create a
temporary Cognito user, authenticate using the existing SPA client's password
challenge, and exercise API Gateway and CloudFront. Writes use dedicated Notion
records, which are moved to trash during cleanup; the Cognito user is deleted.
The caller needs SSM reads and the Cognito admin operations used by the tests.
Tokens and integration secrets are kept in memory.

## Deployment

```sh
mise run nitro-api:bootstrap dev # Once per environment, before its first publication
mise run nitro-api:deploy dev
```

Packaging writes `.output/lambda.zip` containing `server/` and its traced runtime
dependencies. The deploy task selects the requested Terraform workspace, builds
the ZIP, and uploads it to
`s3://<stage>-46ki75-internal-s3-bucket-nitro-api-artifacts/nitro-api/lambda.zip`
before running interactive apply; inspect its plan for other stack changes.

The Terraform-managed artifact bucket is private, encrypted, and versioned.
`nitro-api:bootstrap` creates only that bucket and its configuration, allowing the
first upload before the Lambda is planned. Uploads use a single-part PUT with an
S3-validated SHA-256 checksum. Terraform resolves the latest published object to
its immutable version ID and checksum at plan time, uses handler
`server/index.handler`, publishes a Lambda version, and updates the `stable` alias.
Previous S3 versions are retained.

Use `mise run nitro-api:publish <stage>` to build and upload before reviewing a
separate Terraform plan/apply. Publication makes that version the desired artifact
for subsequent plans in that workspace. Once an artifact is published, all shared
Terraform workflows work from a clean checkout without a local Nitro ZIP. The
deployment identity needs S3 versioning reads, object uploads, and versioned-object
reads in addition to its existing Terraform permissions.

API Gateway has exact collection and greedy child routes per migrated feature,
all using the existing Cognito JWT authorizer. The `nitro_api_features` Terraform
variable supports staged cutovers while the Rust fallback implementation exists.
`GET /api/health/nitro` verifies the new integration. CloudFront forwards `/api/*`
through the same API Gateway origin.

## OpenAPI

```sh
mise run nitro-api:generate-openapi
```

Commit the generated `openapi.json`. The Rust API composes this document with its
own routes at `/api/v1/openapi.json`, rejecting duplicate paths or schema names.
`check:openapi` detects stale generated output. Regenerate the frontend client with
`mise run web:generate-openapi` after API contract changes.
