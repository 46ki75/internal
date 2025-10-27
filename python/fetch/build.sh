#!/bin/bash

set -ueo pipefail

docker buildx build --progress=plain -t fetch .
