import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { Construct } from "constructs";

import { LlrtBinaryType } from "cdk-lambda-llrt";
import { PolicyStatement, Effect, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { ApiRouteLambda } from "./constructs/api-route-lambda";

interface BackendStackProps extends cdk.StackProps {
  isProd?: boolean;
}

export class BackendStack extends cdk.Stack {
  public httpApi: apigateway.HttpApi;

  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const { region, account } = cdk.Stack.of(this);

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

    const usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: this.createResourceName("UsersTable"),
    });

    const allowOrigins = ["https://short.as", "https://www.short.as", "https://dev.short.as"];

    if (!props?.isProd) {
      allowOrigins.push(
        ...["http://localhost", "http://localhost:3000", "https://localhost", "https://localhost:3000"],
      );
    }

    this.httpApi = new apigateway.HttpApi(this, "HttpAPI", {
      apiName: this.createResourceName("HttpAPI"),
      corsPreflight: {
        allowMethods: [apigateway.CorsHttpMethod.GET, apigateway.CorsHttpMethod.POST],
        allowOrigins,
        // Needed for cookies
        allowCredentials: true,
      },
    });

    if (!props?.isProd) {
      this.enableHttpApiLogging();
    }

    new ApiRouteLambda(this, "CreateShortUrlLambda", {
      httpApi: this.httpApi,
      lambdaProps: {
        // This filepath is relative to the root of the infra package I believe
        entry: "../lambda/src/handlers/create-short-url.ts",
        handler: "createShortUrlHandler",
        functionName: this.createResourceName("CreateShortUrlLambda"),
        // This handler uses the CloudWatch client so it needs the full SDK,
        // the other handlers can just use the standard SDKs that are bundled
        llrtBinaryType: LlrtBinaryType.FULL_SDK,
        environment: {
          COUNT_BUCKETS_TABLE_NAME: countBucketsTable.tableName,
          URLS_TABLE_NAME: urlsTable.tableName,
        },
      },
      path: "/create-short-url",
      methods: [apigateway.HttpMethod.POST],
      warming: true,
      policyStatements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
          resources: [countBucketsTable.tableArn, urlsTable.tableArn],
        }),
        new PolicyStatement({ effect: Effect.ALLOW, actions: ["cloudwatch:PutMetricData"], resources: ["*"] }),
      ],
    });

    new ApiRouteLambda(this, "GetLongUrlLambda", {
      httpApi: this.httpApi,
      lambdaProps: {
        entry: "../lambda/src/handlers/get-long-url.ts",
        handler: "getLongUrlHandler",
        functionName: this.createResourceName("GetLongUrlLambda"),
        environment: {
          URLS_TABLE_NAME: urlsTable.tableName,
        },
      },
      path: "/get-long-url/{shortUrlId}",
      methods: [apigateway.HttpMethod.GET],
      warming: true,
      policyStatements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
          resources: [urlsTable.tableArn],
        }),
      ],
    });

    new ApiRouteLambda(this, "GetLongUrlDetailsLambda", {
      httpApi: this.httpApi,
      lambdaProps: {
        entry: "../lambda/src/handlers/get-long-url.ts",
        handler: "getLongUrlDetailsHandler",
        functionName: this.createResourceName("GetLongUrlDetailsLambda"),
        environment: {
          URLS_TABLE_NAME: urlsTable.tableName,
        },
      },
      path: "/get-long-url-details/{shortUrlId}",
      methods: [apigateway.HttpMethod.GET],
      warming: true,
      policyStatements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
          resources: [urlsTable.tableArn],
        }),
      ],
    });

    new ApiRouteLambda(this, "OAuthLambda", {
      httpApi: this.httpApi,
      lambdaProps: {
        entry: "../lambda/src/handlers/oauth-proxy.ts",
        handler: "oAuthHandler",
        functionName: this.createResourceName("OAuthLambda"),
        // This handler uses the SSM client so it needs the full SDK
        llrtBinaryType: LlrtBinaryType.FULL_SDK,
        environment: {
          USERS_TABLE_NAME: usersTable.tableName,
          IS_PROD: props?.isProd ? "true" : "false",
        },
      },
      path: "/oauth/{proxy+}",
      methods: [apigateway.HttpMethod.GET],
      warming: true,
      policyStatements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"],
          resources: [usersTable.tableArn],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ssm:GetParameter"],
          resources: [`arn:aws:ssm:${region}:${account}:parameter/${props?.isProd ? "prod" : "dev"}/oauth/*`],
        }),
      ],
    });
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }

  // https://www.kevinwmcconnell.com/cdk/http-api-logs-with-cdk
  enableHttpApiLogging() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const stage = this.httpApi.defaultStage!.node.defaultChild as apigateway.CfnStage;
    const logGroup = new LogGroup(this.httpApi, "AccessLogs", { retention: 90 });

    stage.accessLogSettings = {
      destinationArn: logGroup.logGroupArn,
      // https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-logging.html#http-api-enable-logging.examples
      format: JSON.stringify({
        requestId: "$context.requestId",
        ip: "$context.identity.sourceIp",
        requestTime: "$context.requestTime",
        httpMethod: "$context.httpMethod",
        routeKey: "$context.routeKey",
        status: "$context.status",
        protocol: "$context.protocol",
        responseLength: "$context.responseLength",
        extendedRequestId: "$context.extendedRequestId",
      }),
    };

    logGroup.grantWrite(new ServicePrincipal("apigateway.amazonaws.com"));
  }
}
