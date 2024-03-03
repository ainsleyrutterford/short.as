import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { LlrtFunction } from 'cdk-lambda-llrt';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class TinyMuStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const testBucket = new s3.Bucket(this, 'MyFirstBucket', { versioned: true, removalPolicy: cdk.RemovalPolicy.DESTROY });

    const testHandler = new LlrtFunction(this, 'TestHandler', {
      // This filepath is relative to the root of the infra package I believe
      entry: '../lambda/src/index.ts',
      functionName: this.createResourceName('TestHandler'),
    });

    testHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:ListAllMyBuckets'],
        resources: ['*'],
      })
    );
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
