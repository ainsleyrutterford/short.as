# E2E Tests

End-to-end tests using [Playwright](https://playwright.dev/).

## Setup

```bash
npm install
npx playwright install
```

## Running tests

Logged-out tests work with no extra config. Logged-in tests need AWS credentials to seed the test user in DynamoDB and fetch the JWT signing key from SSM.

### Against dev.short.as (default)

```bash
npx playwright test
```

### Against prod

```bash
BASE_URL=https://short.as npx playwright test
```

### Other useful commands

```bash
# Run in headed mode to watch
npx playwright test --headed

# Run with UI mode for debugging
npx playwright test --ui

# Generate test code by recording actions
npx playwright codegen dev.short.as
```

## Cleanup

Soft-delete leftover URLs created by the e2e test user if a test failed and it wasn't able to clean up after itself:

```bash
# Dev (default)
./cleanup.sh

# Prod
./cleanup.sh prod
```
