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

# LLRT pre-warms TLS connections to AWS on startup by default.
# Disable this since we're connecting to a local HTTP server, not real AWS.
export LLRT_SDK_CONNECTION_WARMUP=0

echo "Starting moto server on port 5111..."
moto_server -p 5111 > /dev/null 2>&1 &
MOTO_PID=$!

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
.llrt/llrt test -d test/integration/dist
EXIT_CODE=$?

echo ""
echo "Stopping moto server..."
kill $MOTO_PID 2>/dev/null
exit $EXIT_CODE
