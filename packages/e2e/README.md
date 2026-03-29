# E2E Tests

End-to-end tests using [Playwright](https://playwright.dev/).

## Setup

```bash
npm install
npx playwright install
```

## Running tests

```bash
# Run against dev.short.as (default)
npx playwright test

# Run against a specific URL
BASE_URL=https://localhost:3000 npx playwright test

# Run in headed mode to watch
npx playwright test --headed

# Run with UI mode for debugging
npx playwright test --ui

# Generate test code by recording actions
npx playwright codegen dev.short.as
```

Logged-in tests require a JWT signing key:

```bash
JWT_SIGNING_KEY=<key> npx playwright test
```
