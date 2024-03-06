import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { LlrtFunction } from 'cdk-lambda-llrt';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export class TinyMuStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const countBucketsTable = new dynamodb.Table(this, 'CountBucketsTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.createResourceName('CountBucketsTable'),
    });

    const testHandler = new LlrtFunction(this, 'TestHandler', {
      // This filepath is relative to the root of the infra package I believe
      entry: '../lambda/src/index.ts',
      functionName: this.createResourceName('TestHandler'),
      environment: {
        COUNT_BUCKETS_TABLE_NAME: countBucketsTable.tableName,
      }
    });

    testHandler.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:Query',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:ConditionCheckItem',
        ],
        resources: [countBucketsTable.tableArn],
      })
    );
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
