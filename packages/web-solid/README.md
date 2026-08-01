# Internal Web

Client-rendered [SolidStart](https://docs.solidjs.com/solid-start) frontend for
`internal.46ki75.com`.

## Development

Run commands from this directory:

```sh
pnpm dev                  # SolidStart dev server on :11070
pnpm test                 # All hermetic test tiers
pnpm test.unit            # Happy DOM component and model tests
pnpm test.contract        # HTTP contracts intercepted with MSW
pnpm test.browser         # Chromium component integration tests
pnpm test.e2e             # Opt-in deployed application smoke test
pnpm test.live            # Opt-in deployed API smoke test
pnpm build.types          # TypeScript check
pnpm lint                 # ESLint with Solid rules
pnpm fmt / pnpm fmt.check # Prettier
pnpm storybook            # Storybook on :11071
pnpm build-storybook      # Static Storybook build
pnpm build                # Build the production CSR bundle
```

`pnpm dev` proxies `/api` and `/invocations` to the dev CloudFront domain.
Set `VITE_STAGE_NAME` to `dev`, `stg`, or `prod` to select another stage.

## Structure

- `src/routes/` contains SolidStart file routes and page composition.
- `src/components/` contains prop-driven, Storybook-testable UI units.
- `src/container/` owns browser state, API calls, and feature orchestration.
- `src/context/` owns persistent auth and Anki state shared across routes.
- `src/openapi/schema.ts` is generated from the Rust API and must not be edited.

Authenticated data remains client-side because SSR is disabled.
Browser integrations are initialized in `onMount` and cleaned up with
`onCleanup`.

## Testing

Unit tests are colocated with their source as `*.test.ts(x)`. Transport
contracts use `*.contract.test.ts` and run with MSW configured to reject
unhandled requests. Browser tests live under `tests/browser/` and exercise real
components in headless Chromium. `pnpm test` runs all three hermetic tiers.
Install Chromium once before running the browser tier locally:

```sh
pnpm exec playwright install chromium
```

The opt-in live smoke test calls the deployed authenticated API and is excluded
from `pnpm test`. Supply a short-lived Cognito access token explicitly:

```sh
LIVE_API_BASE_URL=https://api.dev-internal.46ki75.com \
LIVE_API_ACCESS_TOKEN=... \
pnpm test.live
```

The end-to-end smoke test verifies that the deployed application can load a
routed page. It is also excluded from the default suite:

```sh
E2E_BASE_URL=https://dev-internal.46ki75.com pnpm test.e2e
```

## OpenAPI

Start `crates/http-api` locally, then regenerate the client types:

```sh
pnpm generate:openapi
```

## Deployment

`pnpm build` emits the application shell and client assets into
`.output/public`. CloudFront rewrites extensionless browser routes to
`/index.html`. Files from `public/`, including `practical_test_en.html`, are
copied into the same output.

```sh
pnpm deploy.dev
pnpm deploy.stg
pnpm deploy.prod
```

Deployment syncs `.output/public` to the stage S3 bucket and invalidates the
CloudFront distribution.
