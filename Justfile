# Workspace-wide Rust recipes. Per-crate recipes (dev/build/deploy/coverage)
# live in each crate's own Justfile, e.g. crates/http_api/Justfile.

# Reject unformatted code (CI gate).
fmt-check:
    cargo fmt --all -- --check

# Deny all clippy warnings across every crate and target (CI gate).
lint:
    cargo clippy --workspace --all-targets -- -D warnings

# Hermetic tests only — live tests are `#[ignore]`'d and skipped here.
test:
    cargo test --workspace

# Live / approval-required tests (network + AWS credentials). Not a PR gate.
test-live:
    cargo test --workspace -- --ignored

# Instrumented hermetic run (no report emitted yet).
test-cov:
    cargo llvm-cov --no-report --workspace

# Per-file table (drops 100%-covered files) + uncovered line numbers.
coverage: test-cov
    cargo llvm-cov report --show-missing-lines --color=always 2>&1 | grep -v " 100.00%"

# Local HTML drilldown.
coverage-html: test-cov
    cargo llvm-cov report --html --open

# CI: emit lcov.info for upload/inspection.
coverage-ci: test-cov
    cargo llvm-cov report --lcov --output-path lcov.info

# Full PR gate.
ci: fmt-check lint test

# Gate plus live tests, for manual dispatch behind an approval environment.
ci-live: fmt-check lint test test-live
