#!/usr/bin/env bash
set -euo pipefail
stage="${1:?Usage: deploy.sh <dev|stg|prod>}"
case "$stage" in dev|stg|prod) ;; *) echo "Invalid stage: $stage" >&2; exit 1 ;; esac
cd "$(dirname "$0")/../../.."
exec python scripts/lambda_release.py deploy nitro-api "$stage"
