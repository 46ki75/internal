# Internal

Rust and Nitro Lambda services, a SolidStart frontend, Python services, and shared Terraform.
See [AGENTS.md](AGENTS.md) for the repository architecture and project rules.
These repository rules supersede the bundled development-standards skill's older
Just and Python-version-file examples.

## Setup

Install [mise](https://mise.jdx.dev/installing-mise.html) 2026.9.9 or newer and
[rustup](https://rustup.rs/), then:

```sh
mise trust mise.toml
mise install node pnpm python uv terraform awscli zig cargo-lambda cargo-llvm-cov
mise run --silent setup
```

Exact tool versions live in `mise.toml`; pnpm's exact version and checksum come
from `package.json#packageManager`. Commit `mise.lock` and `.mise/locks/` sidecars
when updating tools. Locks cover macOS arm64 and Linux x64/arm64. CI and
devcontainers use the same configuration.

Rustup owns Rust through `rust-toolchain.toml`, including LLVM coverage tools and
the arm64 Lambda target. Keep rustup's Cargo proxies on PATH. Check selection
with `mise exec -- rustup show active-toolchain`.

Mise supplies Python; uv owns the shared `.venv`. `UV_PYTHON` binds uv to the
mise interpreter. `setup:python` syncs every workspace package and dependency
group; normal checks/tests use `--locked --no-sync`. Runtime images declare
their own Python requirements separately from the development interpreter.

## Tasks

`mise tasks ls --all` lists the root and package-owned tasks. Use
`mise run --silent <task>` for routine local work and rerun a failure without
`--silent` for complete diagnostics. From the repository root, descendant tasks
use absolute names such as `//packages/web-solid:check`; from within a configured
workspace, use the shorter `:check` form. Mise must also be on PATH for editor and
Git hooks.

| Command                                                        | Purpose                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `mise run --silent fmt`                                        | Format tracked files through Lefthook                       |
| `mise run --silent fmt-check`                                  | Check the same formatter scope                              |
| `mise run --silent lint`                                       | Run native linters without fixes                            |
| `mise run --silent check:quick`                                | Run the fast static feedback gate                           |
| `mise run --silent check`                                      | Run the complete project-wide CI quality gate               |
| `mise run --silent test`                                       | Run all ordinary hermetic tests                             |
| `mise run --silent //crates:check`                             | Run Rust formatting, Clippy, and hermetic tests             |
| `mise run --silent //crates:coverage:ci`                       | Generate workspace `lcov.info`                              |
| `mise run --silent //crates:http-api:dev`                      | Watch the API with development debug logs                   |
| `mise run --silent //crates:http-api:deploy <stage>`           | Build and deploy the arm64 API                              |
| `mise run --silent //packages/http-api:dev`                    | Run the Notion HTTP API on port 11072                       |
| `mise run --silent //packages/http-api:test:live`              | Verify the deployed dev API with temporary test records     |
| `mise run --silent //packages/http-api:bootstrap <stage>`      | Create the versioned artifact bucket before its first use   |
| `mise run --silent //packages/http-api:publish <stage>`        | Package Nitro and publish a checksummed S3 object version   |
| `mise run --silent //packages/http-api:deploy <stage>`         | Publish Nitro and apply Terraform in the selected workspace |
| `mise run --silent //crates:logs-reporter:deploy <stage>`      | Build and deploy the reporter                               |
| `mise run --silent //packages/web-solid:dev`                   | Start the frontend on port 11070                            |
| `mise run --silent //packages/web-solid:check`                 | Check, test, and build the frontend                         |
| `mise run --silent //packages/web-solid:deploy <stage>`        | Build, upload, and invalidate the frontend                  |
| `mise run --silent //python:ag-ui-server:build <stage> [tag]`  | Build and **push** an arm64 ECR image                       |
| `mise run --silent //python:ag-ui-server:deploy <stage> [tag]` | Push an image, then apply Terraform interactively           |

Stages are `dev`, `stg`, or `prod`; omitted image tags use a timestamp. Existing
AWS profile/credential setup is required for deployment and live operations.
`//crates:test:live`, `//crates:check:live`, and package `test:live` tasks remain
explicit and credential-dependent. Coverage tasks share Cargo's instrumentation
state; run one coverage scope at a time.

The Notion-backed endpoints live in [packages/http-api](packages/http-api/README.md).
Apply the Nitro routes before deploying the Rust API during an environment's first
migration. `mise run --silent //packages/web-solid:generate-openapi` regenerates
the frontend client from the composed Rust/Nitro document without a running server.

`fmt`, `fmt-check`, and `lint` accept repeated `--file <repo-relative-path>`
arguments, including explicit untracked files, or `--all-files`. `check:quick`,
`test`, and `check` are always project-wide. Selecting one Rust file still invokes
the workspace-wide Cargo formatter/linter. Existing Lefthook exclusions and
staged-file handling apply.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request targeting `main` and every
push to `main`, including documentation and tooling-only changes. Separate jobs
run `check:quick` and each package-owned `check` leaf from the root `check` graph;
together they implement the same complete gate while preserving CI parallelism.

The `Required checks` job succeeds only when all five mandatory jobs succeed;
failed, canceled, or skipped dependencies fail the aggregate. The default-branch
ruleset should require this GitHub Actions status before merging. Rust coverage
is reported separately, and credential-dependent Rust live tests remain manual.

See the shared [mise standard](https://github.com/46ki75/engineering-standard/blob/main/skills/engineering-standard/references/mise/README.md).
