#!/usr/bin/env bash
#
# Build the linux/arm64 image and push it to the stage's ECR repository.
#
#   STAGE_NAME=dev ./build.sh            # push :latest to dev/ag-ui-server
#   STAGE_NAME=prod TAG=v2 ./build.sh    # push :v2 to prod/ag-ui-server
#
# The ECR repo (`<stage>/ag-ui-server`), the AgentCore runtime, and the
# CloudFront wiring are provisioned by the shared Terraform stack
# (terraform/bedrock-agentcore.tf). Push a new image, then `terraform apply`
# (use a fresh TAG to force a new runtime version — re-pushing :latest does not
# change Terraform state).
#
# On an x86 host, enable arm64 emulation once:
#   docker run --privileged --rm tonistiigi/binfmt --install arm64
set -euo pipefail

STAGE_NAME="${STAGE_NAME:?set STAGE_NAME to dev | stg | prod}"
TAG="${TAG:-latest}"
REGION="${REGION:-ap-northeast-1}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"

# Pin this package's third-party deps from the workspace lock into the build
# context so the image is reproducible without shipping the whole workspace.
uv export --directory "$ROOT" --package ag-ui-server \
  --no-dev --no-emit-workspace --frozen --no-hashes \
  -o "$HERE/requirements.txt"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
REPO="${REGISTRY}/${STAGE_NAME}/ag-ui-server"

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

# Also move :latest onto this image (unless TAG already is :latest) so a plain
# `terraform apply`, which defaults the runtime tag back to :latest, can never
# roll the runtime back to an image older than the one just deployed.
EXTRA_TAGS=()
if [[ "$TAG" != "latest" ]]; then
  EXTRA_TAGS+=(-t "${REPO}:latest")
fi

# --provenance=false: AgentCore Runtime wants a single linux/arm64 manifest, not
# a buildx attestation/manifest-list (same gotcha as AWS Lambda images).
docker buildx build --platform linux/arm64 --provenance=false \
  -t "${REPO}:${TAG}" "${EXTRA_TAGS[@]}" --push "$HERE"

echo "pushed ${REPO}:${TAG}${EXTRA_TAGS:+ and ${REPO}:latest}"
