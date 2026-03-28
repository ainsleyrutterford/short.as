# `lambda`

This package contains the Lambda source code. User facing Lambdas use the [LLRT runtime](https://github.com/awslabs/llrt) for fast cold starts, while others use Node.js.

## Testing

This package has two test runners:

- **LLRT** — uses LLRT's built-in test runner
- **Node/Jest** — uses Jest with `ts-jest`

### Test structure

- `test/shared/` — pure functions that are run in both LLRT and Node
- `test/llrt/` — LLRT specific tests
- `test/node/` — Node specific tests
- `test/integration/` — integration tests that run handlers against [moto](https://github.com/getmoto/moto) (a local AWS emulator)

### Running tests

```bash
# Run all unit tests (LLRT + Node)
npm test

# Run only LLRT tests
npm run test:llrt

# Run only Node tests
npm run test:node

# Run integration tests (requires moto, see below)
npm run test:integration
```

### LLRT test setup

Download the LLRT binary for your platform from the [LLRT releases](https://github.com/awslabs/llrt/releases):

```bash
# macOS arm64 (Apple Silicon)
npm run install-llrt-test-runner-mac-arm

# macOS x64 (Intel)
npm run install-llrt-test-runner-mac

# Linux x64
npm run install-llrt-test-runner-linux
```

LLRT tests are written in TypeScript and compiled to JavaScript before running.

### Node test setup

Node tests use Jest with `ts-jest` and can import TypeScript directly:

```bash
npm run test:node
```

### Integration test setup

Integration tests run handler code through LLRT against [moto](https://github.com/getmoto/moto), a local AWS service emulator. This lets us test real AWS SDK calls (DynamoDB, SSM, Firehose, etc.) without hitting actual AWS.

The tests call the actual handler functions, which use the real AWS SDK clients. The clients are pointed at moto via the `AWS_ENDPOINT_OVERRIDE` env var (see `src/clients/`).

#### One-time setup

```bash
pip3 install "moto[server]"
```

#### Running

```bash
npm run test:integration
```

The script automatically starts moto, runs the tests, and stops moto when done.

If moto is left running by mistake (e.g. after a crash), you can kill it with:

```bash
kill -9 $(lsof -ti:5111)
```
