#!/bin/bash
# Soft-delete all URLs owned by the e2e test user
# Usage: ./cleanup.sh [dev|prod] [user-id]

STAGE="${1:-dev}"
TABLE="Backend-${STAGE}-UrlsTable"
INDEX="GSI-owningUserId-createdTimestamp"
REGION="eu-west-2"
USER_ID="${2:-e2e-test-user}"

ids=$(aws dynamodb query --region "$REGION" --no-cli-pager \
  --table-name "$TABLE" \
  --index-name "$INDEX" \
  --key-condition-expression "owningUserId = :uid" \
  --filter-expression "attribute_not_exists(isDeleted) OR isDeleted = :f" \
  --expression-attribute-values "{\":uid\": {\"S\": \"$USER_ID\"}, \":f\": {\"BOOL\": false}}" \
  --projection-expression "shortUrlId" \
  --output json | python3 -c "
import json, sys
items = json.load(sys.stdin).get('Items', [])
for item in items:
    print(item['shortUrlId']['S'])
")

count=$(echo "$ids" | grep -c .)

if [ "$count" -eq 0 ]; then
  echo "No URLs found for $USER_ID in $TABLE"
  exit 0
fi

echo "Soft-deleting $count URLs for $USER_ID in $TABLE..."

for id in $ids; do
  aws dynamodb update-item --region "$REGION" --no-cli-pager \
    --table-name "$TABLE" \
    --key "{\"shortUrlId\": {\"S\": \"$id\"}}" \
    --update-expression "SET isDeleted = :d" \
    --expression-attribute-values '{":d": {"BOOL": true}}'
  echo "  deleted $id"
done

echo "Done"
