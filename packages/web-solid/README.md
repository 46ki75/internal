# Internal Web

Client-rendered [SolidStart](https://docs.solidjs.com/solid-start) frontend for
`internal.46ki75.com`.

## Development

Run commands from this directory:

```sh
mise run --silent //:setup:node  # Install locked workspace dependencies
mise run --silent :dev          # SolidStart dev server on :11070
mise run --silent :test         # Vitest component and model tests
mise run --silent :typecheck    # TypeScript check
mise run --silent :lint         # ESLint and Stylelint
mise run --silent :fmt          # Prettier
mise run --silent :storybook    # Storybook on :11071
mise run --silent :storybook:build # Static Storybook build
mise run --silent :build        # Build the production CSR bundle
mise run --silent :check        # Complete package quality gate and build
```

`:dev` proxies `/api` and `/invocations` to the dev CloudFront domain.
Set `VITE_STAGE_NAME` to `dev`, `stg`, or `prod` to select another stage.

### TypeScript tooling

`@typescript/native` aliases TypeScript 7 and provides `tsc` for type checks.
The `typescript` dependency aliases `@typescript/typescript6`, which provides
the compiler API needed by ESLint, OpenAPI generation, and editor plugins.
Keep both aliases: TypeScript 7.0 does not expose the JavaScript compiler API.
See Microsoft's [side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).

## Structure

- `src/routes/` contains SolidStart file routes and page composition.
- `src/components/` contains prop-driven, Storybook-testable UI units.
- `src/container/` owns browser state, API calls, and feature orchestration.
- `src/context/` owns persistent auth and Anki state shared across routes.
- `src/openapi/schema.ts` is generated from the composed Rust/Nitro API and must not be edited.

Authenticated data remains client-side because SSR is disabled.
Browser integrations are initialized in `onMount` and cleaned up with
`onCleanup`.

## OpenAPI

Regenerate the client types without a running server or AWS credentials:

```sh
mise run --silent :generate-openapi
```

This runs the Rust `export_openapi` example, which includes the committed Nitro
fragment. After changing Nitro contracts, run
`mise run --silent //packages/http-api:generate-openapi` first.

## Deployment

`:build` emits the application shell and client assets into
`.output/public`. CloudFront rewrites extensionless browser routes to
`/index.html`. Files from `public/`, including `practical_test_en.html`, are
copied into the same output.

```sh
mise run --silent :deploy dev
mise run --silent :deploy stg
mise run --silent :deploy prod
```

Deployment syncs `.output/public` to the stage S3 bucket and invalidates the
CloudFront distribution.
