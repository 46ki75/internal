# Internal Web

Client-rendered [SolidStart](https://docs.solidjs.com/solid-start) frontend for
`internal.46ki75.com`.

## Development

Run commands from this directory:

```sh
pnpm dev                  # SolidStart dev server on :11070
pnpm test                 # Vitest component and model tests
pnpm build:types          # TypeScript check
pnpm lint                 # ESLint with Solid rules
pnpm fmt / pnpm fmt:check # Prettier
pnpm storybook            # Storybook on :11071
pnpm build-storybook      # Static Storybook build
pnpm build                # Build the production CSR bundle
```

`pnpm dev` proxies `/api` and `/invocations` to the dev CloudFront domain.
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
pnpm generate:openapi
```

This runs the Rust `export_openapi` example, which includes the committed Nitro
fragment. After changing Nitro contracts, run `mise run nitro-api:generate-openapi`
first.

## Deployment

`pnpm build` emits the application shell and client assets into
`.output/public`. CloudFront rewrites extensionless browser routes to
`/index.html`. Files from `public/`, including `practical_test_en.html`, are
copied into the same output.

```sh
pnpm deploy:dev
pnpm deploy:stg
pnpm deploy:prod
```

Deployment syncs `.output/public` to the stage S3 bucket and invalidates the
CloudFront distribution.
