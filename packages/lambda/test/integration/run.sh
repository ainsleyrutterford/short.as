# Points all SDK clients (src/clients/) at the local moto server
export AWS_ENDPOINT_OVERRIDE=http://127.0.0.1:5111

# Fake AWS credentials, moto accepts any values
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Required by LLRT's built-in SDK to know which region to sign requests for
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1

# DynamoDB table names used by both the handlers and test setup (setup.ts)
export URLS_TABLE_NAME=test-UrlsTable
export COUNT_BUCKETS_TABLE_NAME=test-CountBucketsTable
export USERS_TABLE_NAME=test-UsersTable
export AGGREGATION_TABLE_NAME=test-AggregationTable
export USER_ID_GSI_NAME=GSI-owningUserId-createdTimestamp
export ANALYTICS_FIREHOSE_STREAM_NAME=test-AnalyticsStream

# LLRT pre-warms TLS connections to AWS on startup by default.
# Disable this since we're connecting to a local HTTP server, not real AWS.
export LLRT_SDK_CONNECTION_WARMUP=0

echo "Building integration tests..."
rm -rf test/integration/dist
for f in test/integration/*.test.ts; do
  name=$(basename "$f" .test.ts)
  npx esbuild "$f" --outdir="test/integration/dist/$name" --platform=node --target=es2020 --format=esm --bundle --external:@aws-sdk --external:uuid --log-level=warning
done

echo "Starting moto server on port 5111..."
moto_server -p 5111 > /dev/null 2>&1 &
MOTO_PID=$!
# Ensure moto is stopped when the script exits (success, failure, or Ctrl+C)
trap 'echo "" && echo "Stopping moto server..." && kill $MOTO_PID 2>/dev/null' EXIT

echo "Waiting for moto to be ready..."
for i in $(seq 1 20); do
  curl -s http://127.0.0.1:5111/moto-api/ > /dev/null 2>&1 && break
  sleep 0.5
done

if ! curl -s http://127.0.0.1:5111/moto-api/ > /dev/null 2>&1; then
  echo "ERROR: moto server failed to start. Is moto installed? Run: pip3 install \"moto[server]\""
  exit 1
fi

echo "moto is ready. Running integration tests..."
echo ""
# Run each test file sequentially to avoid moto state conflicts between files
for dir in test/integration/dist/*/; do
  .llrt/llrt test -d "$dir" || exit 1
done
