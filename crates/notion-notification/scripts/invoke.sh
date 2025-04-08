#!/bin/bash

set -e -u -o pipefail

if [ -z "${FUNCTION_NAME}" ]; then
  echo "FUNCTION_NAME is not set"
  exit 1
fi

cleanup() {
  if [[ -n "${WATCH_PID:-}" ]]; then
    kill "$WATCH_PID" || true
  fi
}

cargo lambda watch &
WATCH_PID=$!

trap cleanup EXIT

sleep 0.1

cargo lambda invoke "${FUNCTION_NAME}" --data-file ./scripts/raw.json
