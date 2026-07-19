# Internal Web

Static [SolidStart](https://docs.solidjs.com/solid-start) frontend for
`internal.46ki75.com`.

## Development

Run commands from this directory:

```sh
pnpm dev                  # SolidStart dev server on :11070
pnpm test                 # Vitest component and model tests
pnpm build.types          # TypeScript check
pnpm lint                 # ESLint with Solid rules
pnpm fmt / pnpm fmt.check # Prettier
pnpm storybook            # Storybook on :11071
pnpm build-storybook      # Static Storybook build
pnpm build                # Prerender the production site
```

`pnpm dev` proxies `/api` and `/invocations` to the dev CloudFront domain.
Set `VITE_STAGE_NAME` to `dev`, `stg`, or `prod` to select another stage.

## Structure

- `src/routes/` contains SolidStart file routes and page composition.
- `src/components/` contains prop-driven, Storybook-testable UI units.
- `src/container/` owns browser state, API calls, and feature orchestration.
- `src/context/` owns persistent auth and Anki state shared across routes.
- `src/openapi/schema.ts` is generated from the Rust API and must not be edited.

Authenticated data remains client-side because the deployed pages are static.
Browser integrations are initialized in `onMount` and cleaned up with
`onCleanup`.

## OpenAPI

Start `crates/http-api` locally, then regenerate the client types:

```sh
pnpm generate:openapi
```

## Deployment

`pnpm build` prerenders `/`, `/anki`, `/chat`, `/icon`, `/swatch`, and
`/trivia` into `.output/public`. Files from `public/`, including
`practical_test_en.html`, are copied into the same output.

```sh
pnpm deploy.dev
pnpm deploy.stg
pnpm deploy.prod
```

Deployment syncs `.output/public` to the stage S3 bucket and invalidates the
CloudFront distribution.
