#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';
import { WebsiteStack } from '../lib/website-stack';

const ACCOUNT_ID = '381492110289';
const REGION = 'eu-west-2';

const app = new cdk.App();

// Stacks used for development and testing
const devBackend = new BackendStack(app, 'TinyMu-dev', { env: { account: ACCOUNT_ID, region: REGION } });
const devWebsite = new WebsiteStack(app, 'Website-dev', { httpApi: devBackend.httpApi, env: { account: ACCOUNT_ID, region: REGION } });
devWebsite.addDependency(devBackend);

// The prod stacks that the GitHub action deploys to
const prodBackend = new BackendStack(app, 'TinyMu-prod', { env: { account: ACCOUNT_ID, region: REGION } });
const prodWebsite = new WebsiteStack(app, 'Website-prod', { httpApi: prodBackend.httpApi, env: { account: ACCOUNT_ID, region: REGION } });
prodWebsite.addDependency(prodBackend);
