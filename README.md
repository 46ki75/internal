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
mise run --silent //:setup
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

`mise tasks ls --all` lists the root and package-owned tasks. Use absolute root
names such as `mise run --silent //:check` for repository-wide tasks so they work
from any directory, and rerun a failure without `--silent` for complete diagnostics.
From the repository root, descendant tasks use names such as
`//packages/web-solid:check`; from within a configured workspace, use the shorter
`:check` form. Mise must also be on PATH for editor and Git hooks.

| Command                                                        | Purpose                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `mise run --silent //:fmt`                                     | Format tracked files through Lefthook                       |
| `mise run --silent //:fmt-check`                               | Check the same formatter scope                              |
| `mise run --silent //:lint`                                    | Run native linters without fixes                            |
| `mise run --silent //:check:quick`                             | Run the fast static feedback gate                           |
| `mise run --silent //:check`                                   | Run the complete project-wide CI quality gate               |
| `mise run --silent //:test`                                    | Run all ordinary hermetic tests                             |
| `mise run --silent //crates:check`                             | Run Rust formatting, Clippy, and hermetic tests             |
| `mise run --silent //crates:coverage:ci`                       | Generate workspace `lcov.info`                              |
| `mise run --silent //crates:http-api:dev`                      | Watch the API with development debug logs                   |
| `mise run --silent //crates:http-api:push <stage>`             | Build, update API code, and publish a numbered version      |
| `mise run --silent //crates:http-api:promote <stage>`          | Pin API green to the latest published version               |
| `mise run --silent //crates:http-api:rollback <stage>`         | Restore API green from blue, then remove blue               |
| `mise run --silent //packages/http-api:dev`                    | Run the Notion HTTP API on port 11072                       |
| `mise run --silent //packages/http-api:test:live`              | Verify the deployed dev API with temporary test records     |
| `mise run --silent //packages/http-api:bootstrap <stage>`      | Create the versioned artifact bucket before its first use   |
| `mise run --silent //packages/http-api:publish <stage>`        | Package Nitro and publish a checksummed S3 object version   |
| `mise run --silent //packages/http-api:push <stage>`           | Package, update Nitro code, and publish a numbered version  |
| `mise run --silent //packages/http-api:promote <stage>`        | Pin Nitro green to the latest published version             |
| `mise run --silent //packages/http-api:rollback <stage>`       | Restore Nitro green from blue, then remove blue             |
| `mise run --silent //crates:logs-reporter:push <stage>`        | Build, update reporter code, and publish a numbered version |
| `mise run --silent //crates:logs-reporter:promote <stage>`     | Pin reporter green to the latest published version          |
| `mise run --silent //crates:logs-reporter:rollback <stage>`    | Restore reporter green from blue, then remove blue          |
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

### Lambda release lifecycle

The three Terraform-managed Lambdas use `green` for live traffic and an optional
`blue` rollback candidate. `push` updates code and publishes a numbered version
without changing either alias. `promote` resolves the highest published version
once, saves the current green version in blue, then pins green to that number;
it never targets `$LATEST`. Repeating promotion of the live version is a no-op.
`rollback` restores green from blue and then deletes blue, rather than retaining
the failed release as a rollback candidate. Missing blue is valid; an explicit
rollback without it fails clearly and leaves green unchanged. Promotion always
selects the highest published number, including a previously rolled-back release;
push a corrected version before promoting again if the highest version is faulty.

The Lambda `deploy` tasks are deferred: they exit with an error and commands for
`push` and `promote`, without building, contacting AWS, or applying Terraform.
Frontend and AgentCore deployment tasks are unchanged. The unmanaged feed/fetch
build workflows are outside this release controller's scope.

Before using these tasks in an existing environment, follow the
[green alias migration](terraform/README.md#lambda-release-ownership-and-migration).
Do not push new code while live traffic still invokes `$LATEST`. Terraform owns
infrastructure and initial green creation; the release controller owns later
code updates and alias targets. API Gateway and log subscriptions stay attached
to green across promotions and rollbacks.

Release operations are serialized per account, region, and function by conditional
S3 lock objects in the existing Terraform state bucket. The release identity needs
`s3:GetObject`, `s3:PutObject`, and `s3:DeleteObject` on
`lambda-release-locks/*`, Lambda code/version/alias operations and read access, and
`sts:GetCallerIdentity`; Nitro also needs its existing artifact bucket permissions.
An interrupted process can leave a lock: inspect its JSON owner and timestamp,
confirm that process has stopped, then remove that exact lock object before retrying.
Never remove a lock belonging to an active release. Releases must not overlap
Terraform applies or manual Lambda changes, which do not acquire this lock.

The Notion-backed endpoints live in [packages/http-api](packages/http-api/README.md).
Apply the Nitro routes before deploying the Rust API during an environment's first
migration. `mise run --silent //packages/web-solid:generate-openapi` regenerates
the frontend client from the composed Rust/Nitro document without a running server.

`//:fmt`, `//:fmt-check`, and `//:lint` accept repeated
`--file <repo-relative-path>` arguments, including explicit untracked files, or
`--all-files`. `//:check:quick`, `//:test`, and `//:check` are always project-wide.
Selecting one Rust file still invokes
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
