# Notion HTTP API

Standalone Nitro 2 (`nitropack`) API deployed as a Node.js 24 arm64 Lambda.
Uses the official `@notionhq/client` SDK with Notion API `2026-03-11` and npm
`n2a2ui` for A2UI v0.9 surfaces. Read the root [README](../../README.md) and
[repository rules](../../AGENTS.md) before making changes.

## Development

```sh
mise run --silent //:setup:node
mise run --silent :dev
mise run --silent :test
mise run --silent :test:lambda
mise run --silent :check
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
  `anki`, `trivia`, `bookmark`, `todo`, `image`, `image_tag`, or `typing`.

The icon endpoint uses the workspace custom-emoji API. The converter enables
unsupported blocks, image metadata, and bookmark metadata, matching the previous
Rust implementation. Anki splits surfaces at H1 markers `front`, `back`, and
`explanation`. Every returned surface has root ID `root`.

`GET /api/v1/typing` returns `{ id, description, text, surface, url }[]` from every
page in the typing data source. `Title` must be a title property and supplies the
exercise description. `Text` must be a rich-text property: its `plain_text`
fragments are joined without trimming for typing, and `n2a2ui.convertRichTexts`
converts the same fragments into an A2UI `surface` for formatted display. `url`
is the sentence page's URL supplied by Notion. The frontend displays the rich
reference alongside plaintext character feedback, normalizes curly apostrophes
only in the typing text, and shuffles the full list for each practice cycle.
Manage entries through the current sentence's Notion link; there are no editing
or completion count endpoints.

## Tests

Vitest runs in Node. The default suite uses the real official SDK and converter
with mocked HTTP responses. It covers pagination, property mapping, A2UI section
behavior, request validation, and each HTTP contract. The Lambda suite imports
the built `.output/server/index.mjs` and exercises API Gateway v2 events. It runs
with `NODE_ENV=production` so Vitest uses production export conditions matching
Nitro's traced dependencies instead of requesting unbundled development files.

```sh
mise run --silent :test:live
```

Live tests require AWS credentials and run only against `dev`. They create a
temporary Cognito user, authenticate using the existing SPA client's password
challenge, and exercise API Gateway and CloudFront. Writes use dedicated Notion
records, which are moved to trash during cleanup; the Cognito user is deleted.
The caller needs SSM reads and the Cognito admin operations used by the tests.
Tokens and integration secrets are kept in memory.

## Deployment

```sh
mise run --silent :bootstrap dev # Once per environment, before its first publication
mise run --silent :deploy dev
```

Packaging writes `.output/lambda.zip` containing `server/` and its traced runtime
dependencies. The deploy task selects the requested Terraform workspace, builds
the ZIP, and uploads it to
`s3://<stage>-46ki75-internal-s3-bucket-nitro-api-artifacts/nitro-api/lambda.zip`
before running interactive apply; inspect its plan for other stack changes.

The Terraform-managed artifact bucket is private, encrypted, and versioned.
`:bootstrap` creates only that bucket and its configuration, allowing the
first upload before the Lambda is planned. Uploads use a single-part PUT with an
S3-validated SHA-256 checksum. Terraform resolves the latest published object to
its immutable version ID and checksum at plan time, uses handler
`server/index.handler`, publishes a Lambda version, and updates the `stable` alias.
Previous S3 versions are retained.

Use `mise run --silent :publish <stage>` to build and upload before reviewing a
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

For the typing cutover, first create
`/<stage>/46ki75/internal/notion/typing/data_source/id` in SSM and grant the existing
Notion integration access to that data source. Publish/deploy Nitro with `typing`
in `nitro_api_features`, then deploy the Rust API and frontend. No DynamoDB data
migration is needed; the shared table remains in use by writing assessments.

## OpenAPI

```sh
mise run --silent :generate-openapi
```

Commit the generated `openapi.json`. The Rust API composes this document with its
own routes at `/api/v1/openapi.json`, rejecting duplicate paths or schema names.
`check:openapi` detects stale generated output. Regenerate the frontend client with
`mise run --silent //packages/web-solid:generate-openapi` after API contract changes.
