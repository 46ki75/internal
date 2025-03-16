#!/bin/bash

set -e -u -o pipefail

if [ -z "${STAGE_NAME}" ]; then
  echo "STAGE_NAME is not set"
  exit 1
fi

cargo lambda deploy --binary-name internal-graphql "${STAGE_NAME}-46ki75-internal-lambda-function-graphql"
