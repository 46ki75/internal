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

# Full PR gate.
ci: fmt-check lint test

# Gate plus live tests, for manual dispatch behind an approval environment.
ci-live: fmt-check lint test test-live
