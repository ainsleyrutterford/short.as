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

### Running tests

```bash
# Run all tests (LLRT + Node)
npm test

# Run only LLRT tests
npm run test:llrt

# Run only Node tests
npm run test:node
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
