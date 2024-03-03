# `infra`

This package contains both the CDK code for the infrastructure, and the source code for the Lambdas.

## Development

First gain access to the account by either using `aws sso login`, or by copy/pasting the AWS credentials into environment variables. Then you can run the following commands:

* `npm run build`: transpile the TypeScript to JavaScript
* `npm run test`: execute the Jest unit and snapshot tests
* `npx cdk diff TinyMu-dev`: compare the deployed dev stack with current state
* `npx cdk deploy TinyMu-dev`: deploy the dev stack to the AWS account
