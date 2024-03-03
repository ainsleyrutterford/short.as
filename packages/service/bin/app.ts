#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TinyMuStack } from '../lib/stack';

const ACCOUNT_ID = '381492110289';
const REGION = 'eu-west-2';

const app = new cdk.App();

// Stack used for development and testing
new TinyMuStack(app, 'TinyMu-dev', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: ACCOUNT_ID, region: REGION },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// The prod stack that the GitHub action deploys to
new TinyMuStack(app, 'TinyMu-prod', { env: { account: ACCOUNT_ID, region: REGION } });
