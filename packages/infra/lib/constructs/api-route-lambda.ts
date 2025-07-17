import { Construct } from "constructs";
import { LlrtFunction, LlrtFunctionProps } from "cdk-lambda-llrt";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

export interface ApiRouteLambdaProps {
  httpApi: HttpApi;
  lambdaProps: LlrtFunctionProps;
  path: string;
  methods: HttpMethod[];
  warming?: boolean;
  policyStatements?: PolicyStatement[];
}

export class ApiRouteLambda extends Construct {
  public lambda: LlrtFunction;

  constructor(scope: Construct, id: string, props: ApiRouteLambdaProps) {
    super(scope, id);

    const { httpApi, lambdaProps, path, methods, warming, policyStatements } = props;

    // Creating a custom log group so we can change retention, etc. if necessary
    const logGroup =
      lambdaProps.logGroup ??
      new LogGroup(this, "LogGroup", {
        logGroupName: `/aws/lambda/${lambdaProps.functionName}`,
        retention: RetentionDays.TWO_YEARS,
      });

    this.lambda = new LlrtFunction(this, "Lambda", {
      architecture: Architecture.ARM_64,
      logGroup,
      handler: "handler",
      // TODO: remove this and use latest again once LLRT releases this fix: https://github.com/awslabs/llrt/pull/1056
      llrtVersion: "v0.5.1-beta",
      ...lambdaProps,
    });

    policyStatements?.forEach((statement) => this.lambda.addToRolePolicy(statement));

    httpApi.addRoutes({ path, methods, integration: new HttpLambdaIntegration("LambdaIntegration", this.lambda) });

    if (warming) {
      const rule = new Rule(this, "WarmingRule", {
        description: `Warming rule for ${this.lambda.functionName}`,
        schedule: Schedule.rate(Duration.minutes(5)),
      });

      rule.addTarget(new LambdaFunction(this.lambda, { event: RuleTargetInput.fromObject({ warming: true }) }));
    }
  }
}
