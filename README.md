# [short.as](https://short.as)

A URL shortener built for fun.

## Packages

This is a monorepo managed with [Lerna](https://lerna.js.org/). Each package has its own README with detailed instructions:

- [`site`](packages/site/): contains our site source code that builds a Next.js static site
- [`lambda`](packages/lambda/): contains the Lambda handlers (user facing Lambdas use [LLRT](https://github.com/awslabs/llrt), others use Node.js)
- [`infra`](packages/infra/): contains the code for our CDK stacks
- [`e2e`](packages/e2e/): contains [Playwright](https://playwright.dev/docs/intro) end-to-end tests
- [`types`](packages/types/): contains shared TypeScript types
- [`shared`](packages/shared/): contains shared TypeScript utility functions

## Getting started

```bash
npm ci
```

## Development

```bash
npx lerna run build        # build all packages
npx lerna run test         # run all unit tests
npm run lint               # lint all packages
```

See each package's README for more commands (running the dev server, integration tests, deploying stacks, running e2e tests, etc.).

## CI/CD

The [`.github/workflows/ci.yml`](.github/workflows/ci.yml) workflow handles everything:

1. Lints, runs unit tests, and runs integration tests. This is run on every PR and push to `main`.
2. `dev` stacks are deployed on PRs, whereas `prod` stacks are deployed on push to `main`.
3. E2E tests are run against the deployed environment after deployment.
