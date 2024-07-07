#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { WebsiteStack } from "../lib/website-stack";
import { DomainStack } from "../lib/domain-stack";

const ACCOUNT_ID = "381492110289";
const REGION = "eu-west-2";
const US_EAST_1_REGION = "us-east-1";

const app = new cdk.App();

// The domain stack for short.as that is used for both dev and prod. It is deployed by the GitHub action
const devAndProdDomain = new DomainStack(app, "Domain-prod", {
  env: { account: ACCOUNT_ID, region: US_EAST_1_REGION },
  crossRegionReferences: true,
});

// Stacks used for development and testing. These are deployed manually
const devBackend = new BackendStack(app, "Backend-dev", { env: { account: ACCOUNT_ID, region: REGION } });
const devWebsite = new WebsiteStack(app, "Website-dev", {
  isProd: false,
  hostedZone: devAndProdDomain.hostedZone,
  certificate: devAndProdDomain.devCertificate,
  httpApi: devBackend.httpApi,
  env: { account: ACCOUNT_ID, region: REGION },
  crossRegionReferences: true,
});
devWebsite.addDependency(devAndProdDomain);
devWebsite.addDependency(devBackend);

// The prod stacks that the GitHub action deploys
const prodBackend = new BackendStack(app, "Backend-prod", { env: { account: ACCOUNT_ID, region: REGION } });
const prodWebsite = new WebsiteStack(app, "Website-prod", {
  isProd: true,
  hostedZone: devAndProdDomain.hostedZone,
  certificate: devAndProdDomain.certificate,
  httpApi: prodBackend.httpApi,
  env: { account: ACCOUNT_ID, region: REGION },
  crossRegionReferences: true,
});
prodWebsite.addDependency(devAndProdDomain);
prodWebsite.addDependency(prodBackend);
