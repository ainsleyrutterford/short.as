# [tiny.mu](https://tiny.mu)

A tiny URL shortener built for fun. See the design [here](wiki-link).

### Development

```text
npx lerna run build
npx lerna run test
```

See instructions in [`packages/infra/README.md`](packages/infra/README.md) for how to deploy.

### Deployment

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) GitHub action deploys the prod CloudFormation stack when there is a push to the `main` branch.
