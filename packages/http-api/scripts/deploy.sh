#!/usr/bin/env bash
set -euo pipefail
stage="${1:?Usage: deploy.sh <dev|stg|prod>}"
case "$stage" in dev|stg|prod) ;; *) echo "Invalid stage: $stage" >&2; exit 1 ;; esac
cd "$(dirname "$0")/../../.."
terraform -chdir=terraform workspace select "$stage"
test "$(terraform -chdir=terraform workspace show)" = "$stage"
bash packages/http-api/scripts/package.sh
bash packages/http-api/scripts/upload.sh "$stage"
terraform -chdir=terraform apply
