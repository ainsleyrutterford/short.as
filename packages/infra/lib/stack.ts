import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

import { LlrtFunction } from 'cdk-lambda-llrt';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

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

    const urlsTable = new dynamodb.Table(this, 'UrlsTable', {
      partitionKey: {
        name: 'shortUrlId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.createResourceName('UrlsTable'),
    });

    const createShortUrlLambda = new LlrtFunction(this, 'CreateShortUrlLambda', {
      // This filepath is relative to the root of the infra package I believe
      entry: '../lambda/src/index.ts',
      handler: 'createShortUrlHandler',
      functionName: this.createResourceName('CreateShortUrlLambda'),
      environment: {
        COUNT_BUCKETS_TABLE_NAME: countBucketsTable.tableName,
        URLS_TABLE_NAME: urlsTable.tableName,
      }
    });

    const getLongUrlLambda = new LlrtFunction(this, 'GetLongUrlLambda', {
      // This filepath is relative to the root of the infra package I believe
      entry: '../lambda/src/index.ts',
      handler: 'getLongUrlHandler',
      functionName: this.createResourceName('GetLongUrlLambda'),
      environment: {
        URLS_TABLE_NAME: urlsTable.tableName,
      }
    });

    createShortUrlLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:ConditionCheckItem',
        ],
        resources: [countBucketsTable.tableArn, urlsTable.tableArn],
      })
    );

    getLongUrlLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:ConditionCheckItem',
        ],
        resources: [urlsTable.tableArn],
      })
    );

    const httpApi = new apigateway.HttpApi(this, 'HttpAPI', {
      apiName: this.createResourceName('HttpAPI'),
      corsPreflight: {
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowOrigins: ['https://tiny.mu', 'http://localhost'],
      }
    });

    httpApi.addRoutes({
      path: '/create-short-url',
      methods: [apigateway.HttpMethod.POST],
      integration: new HttpLambdaIntegration('CreateShortUrlLambdaIntegration', createShortUrlLambda),
    });

    httpApi.addRoutes({
      path: '/get-long-url/{shortUrlId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetLongUrlLambdaIntegration', getLongUrlLambda),
    });
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
