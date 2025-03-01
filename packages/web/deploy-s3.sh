#!/bin/bash

set -eu -o pipefail

if [ -z "$STAGE_NAME" ]; then
    echo "STAGE_NAME is not set"
    exit 1
fi

S3_BUCKET="${STAGE_NAME}-46ki75-internal-s3-bucket-web"

aws s3 sync .output/public/ s3://${S3_BUCKET} --delete
