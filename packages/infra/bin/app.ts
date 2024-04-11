#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { WebsiteStack } from '../lib/website-stack';
import { ProdDomainStack } from '../lib/prod-domain-stack';

const ACCOUNT_ID = '381492110289';
const REGION = 'eu-west-2';
const US_EAST_1_REGION = 'us-east-1';

const app = new cdk.App();

// Stacks used for development and testing
const devBackend = new BackendStack(app, 'Backend-dev', { env: { account: ACCOUNT_ID, region: REGION } });
const devWebsite = new WebsiteStack(app, 'Website-dev', { httpApi: devBackend.httpApi, env: { account: ACCOUNT_ID, region: REGION } });
devWebsite.addDependency(devBackend);

// The prod stacks that the GitHub action deploys to
const prodDomain = new ProdDomainStack(app, 'Domain-prod', { env: { account: ACCOUNT_ID, region: US_EAST_1_REGION }, crossRegionReferences: true });
const prodBackend = new BackendStack(app, 'Backend-prod', { env: { account: ACCOUNT_ID, region: REGION } });
const prodWebsite = new WebsiteStack(app, 'Website-prod', {
  isProd: true,
  hostedZone: prodDomain.hostedZone,
  certificate: prodDomain.certificate,
  httpApi: prodBackend.httpApi,
  env: { account: ACCOUNT_ID, region: REGION },
  crossRegionReferences: true
});
prodWebsite.addDependency(prodDomain);
prodWebsite.addDependency(prodBackend);
