import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";

import { LlrtBinaryType, LlrtFunction } from "cdk-lambda-llrt";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Architecture } from "aws-cdk-lib/aws-lambda";

interface BackendStackProps extends cdk.StackProps {
  isProd?: boolean;
}

export class BackendStack extends cdk.Stack {
  public httpApi: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const countBucketsTable = new dynamodb.Table(this, "CountBucketsTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.createResourceName("CountBucketsTable"),
    });

    const urlsTable = new dynamodb.Table(this, "UrlsTable", {
      partitionKey: {
        name: "shortUrlId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.createResourceName("UrlsTable"),
    });

    const createShortUrlLambda = new LlrtFunction(this, "CreateShortUrlLambda", {
      // This filepath is relative to the root of the infra package I believe
      entry: "../lambda/src/handlers/create-short-url.ts",
      handler: "createShortUrlHandler",
      architecture: Architecture.ARM_64,
      functionName: this.createResourceName("CreateShortUrlLambda"),
      // Only this handler uses the CloudWatch client so it needs the full SDK,
      // the other handlers can just use the standard SDKs that are bundled
      llrtBinaryType: LlrtBinaryType.FULL_SDK,
      environment: {
        COUNT_BUCKETS_TABLE_NAME: countBucketsTable.tableName,
        URLS_TABLE_NAME: urlsTable.tableName,
      },
    });

    const getLongUrlLambda = new LlrtFunction(this, "GetLongUrlLambda", {
      // This filepath is relative to the root of the infra package I believe
      entry: "../lambda/src/handlers/get-long-url.ts",
      handler: "getLongUrlHandler",
      architecture: Architecture.ARM_64,
      functionName: this.createResourceName("GetLongUrlLambda"),
      environment: {
        URLS_TABLE_NAME: urlsTable.tableName,
      },
    });

    const getLongUrlDetailsLambda = new LlrtFunction(this, "GetLongUrlDetailsLambda", {
      // This filepath is relative to the root of the infra package I believe
      entry: "../lambda/src/handlers/get-long-url.ts",
      handler: "getLongUrlDetailsHandler",
      architecture: Architecture.ARM_64,
      functionName: this.createResourceName("GetLongUrlDetailsLambda"),
      environment: {
        URLS_TABLE_NAME: urlsTable.tableName,
      },
    });

    createShortUrlLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
        resources: [countBucketsTable.tableArn, urlsTable.tableArn],
      }),
    );

    createShortUrlLambda.addToRolePolicy(
      new PolicyStatement({ effect: Effect.ALLOW, actions: ["cloudwatch:PutMetricData"], resources: ["*"] }),
    );

    getLongUrlLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
        resources: [urlsTable.tableArn],
      }),
    );

    getLongUrlDetailsLambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
        resources: [urlsTable.tableArn],
      }),
    );

    const allowOrigins = ["https://short.as", "https://www.short.as", "https://dev.short.as"];

    if (!props?.isProd) {
      allowOrigins.push(...["http://localhost", "http://localhost:3000"]);
    }

    const httpApi = new apigateway.HttpApi(this, "HttpAPI", {
      apiName: this.createResourceName("HttpAPI"),
      corsPreflight: {
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowOrigins,
      },
    });

    httpApi.addRoutes({
      path: "/create-short-url",
      methods: [apigateway.HttpMethod.POST],
      integration: new HttpLambdaIntegration("CreateShortUrlLambdaIntegration", createShortUrlLambda),
    });

    httpApi.addRoutes({
      path: "/get-long-url/{shortUrlId}",
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetLongUrlLambdaIntegration", getLongUrlLambda),
    });

    httpApi.addRoutes({
      path: "/get-long-url-details/{shortUrlId}",
      methods: [apigateway.HttpMethod.GET],
      integration: new HttpLambdaIntegration("GetLongUrlDetailsLambdaIntegration", getLongUrlDetailsLambda),
    });

    this.httpApi = httpApi;
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
