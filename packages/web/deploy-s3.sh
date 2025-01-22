#!/bin/bash

set -eu -o pipefail

if [ -z "$ENVIRONMENT" ]; then
    echo "ENVIRONMENT is not set"
    exit 1
fi

S3_BUCKET="${ENVIRONMENT}-46ki75-internal-s3-bucket-web"

aws s3 rm s3://${S3_BUCKET} --recursive

aws s3 cp .output/public/ s3://${S3_BUCKET} --recursive
