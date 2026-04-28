#!/bin/bash

set -eu -o pipefail

if [ -z "$VITE_STAGE_NAME" ]; then
    echo "VITE_STAGE_NAME is not set"
    exit 1
fi

S3_BUCKET="${VITE_STAGE_NAME}-46ki75-internal-s3-bucket-web"

aws s3 sync ./dist/ s3://${S3_BUCKET} --delete
