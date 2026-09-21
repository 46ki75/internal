#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm build
cd .output
rm -f lambda.zip
zip -qr lambda.zip server
