#!/usr/bin/env bash
set -euo pipefail
stage="${1:?Usage: upload.sh <dev|stg|prod> [artifact.zip]}"
case "$stage" in dev|stg|prod) ;; *) echo "Invalid stage: $stage" >&2; exit 1 ;; esac
cd "$(dirname "$0")/../../.."
artifact="${2:-packages/http-api/.output/lambda.zip}"
bucket="${stage}-46ki75-internal-s3-bucket-nitro-api-artifacts"
checksum="$(node --input-type=module - "$artifact" <<'JS'
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
console.log(createHash("sha256").update(readFileSync(process.argv[2])).digest("base64"));
JS
)"

if [[ "$(aws s3api get-bucket-versioning --region ap-northeast-1 --bucket "$bucket" --query Status --output text)" != "Enabled" ]]; then
  echo "Run mise run nitro-api:bootstrap $stage to enable artifact versioning before publishing." >&2
  exit 1
fi

# A single-part PUT supplies the full-object SHA-256 used by Lambda, rather
# than a multipart checksum. S3 validates it before publishing the new version.
aws s3api put-object \
  --region ap-northeast-1 \
  --bucket "$bucket" \
  --key nitro-api/lambda.zip \
  --body "$artifact" \
  --content-type application/zip \
  --checksum-algorithm SHA256 \
  --checksum-sha256 "$checksum" \
  --query '{VersionId:VersionId,ChecksumSHA256:ChecksumSHA256}' \
  --output json
