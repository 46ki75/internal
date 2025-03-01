#!/bin/bash

set -eu -o pipefail

if [ -z "$STAGE_NAME" ]; then
    echo "STAGE_NAME is not set"
    exit 1
fi

if [ "$STAGE_NAME" = "prod" ]; then
    DISTRIBUTION_ALIAS_DOMAIN="internal.46ki75.com"
else
    DISTRIBUTION_ALIAS_DOMAIN="${STAGE_NAME}-internal.46ki75.com"
fi

echo "Invalidating cache for $DISTRIBUTION_ALIAS_DOMAIN"

DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?@ == '$DISTRIBUTION_ALIAS_DOMAIN']].Id" --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "Distribution ID not found"
    exit 1
else
    echo "Distribution ID: $DISTRIBUTION_ID"
    INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --query "Invalidation.Id" --output text)
    echo "Invalidation ID: $INVALIDATION_ID"
fi
