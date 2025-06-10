# [short.as](https://short.as)

A URL shortener built for fun.

### Development

```text
npm ci
npx lerna run build
npx lerna run test
```

See [`packages/infra/README.md`](packages/infra/README.md) for instructions on how to deploy the backend and website infrastructure.

### Deployment

The [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) GitHub action deploys the prod CloudFormation stack when there is a push to the `main` branch.
