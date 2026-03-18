# `lambda`

This package contains the Lambda source code. Some Lambdas use the [LLRT runtime](https://github.com/awslabs/llrt) for fast cold starts, while others use Node.js.

## Testing

This package has two test runners:

- **LLRT tests** (`test/llrt/*.test.ts`) - Tests code that runs on LLRT using LLRT's built-in test runner
- **Node tests** (`test/node/*.test.ts`) - Tests code that runs on Node.js using Jest

### Running tests

```bash
# Run all tests
npm run test

# Run only LLRT tests
npm run test:llrt

# Run only Node tests
npm run test:node
```

### LLRT test setup

Download the LLRT binary for your system from the [LLRT releases](https://github.com/awslabs/llrt/releases):

```bash
# macOS x64 (Intel)
npm run install-llrt-test-runner-mac

# macOS arm64 (Apple Silicon)
npm run install-llrt-test-runner-mac-arm

# Linux x64
npm run install-llrt-test-runner-linux
```

LLRT tests are written in TypeScript and compiled to JavaScript before running.

### Node test setup

Node tests use Jest with ts-jest and can import TypeScript directly:

```bash
npm run test:node
```
