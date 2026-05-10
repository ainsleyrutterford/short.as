import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as budgets from "aws-cdk-lib/aws-budgets";
import { Duration, Stack } from "aws-cdk-lib";
import { HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { Function } from "aws-cdk-lib/aws-lambda";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { CfnDeliveryStream } from "aws-cdk-lib/aws-kinesisfirehose";

export interface MonitoringProps {
  isProd: boolean;
  httpApi: HttpApi;
  lambdas: Function[];
  tables: ITable[];
  deliveryStream: CfnDeliveryStream;
  alarmEmail: string;
}

export class Monitoring extends Construct {
  private readonly alarmAction?: actions.SnsAction;
  private readonly alarms: cloudwatch.Alarm[] = [];
  private readonly period = Duration.minutes(15);

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const { httpApi, lambdas, tables, deliveryStream } = props;

    if (props.isProd && props.alarmEmail) {
      const topic = new sns.Topic(this, "AlarmTopic", { topicName: "short-as-alarms" });
      topic.addSubscription(new subscriptions.EmailSubscription(props.alarmEmail));
      this.alarmAction = new actions.SnsAction(topic);
    }

    this.addApiGatewayAlarms(httpApi);
    this.addLambdaAlarms(lambdas);
    this.addDynamoDbAlarms(tables);
    this.addFirehoseAlarms(deliveryStream);
    this.addCostCircuitBreaker(props);

    const dashboard = new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: `short-as-${props.isProd ? "prod" : "dev"}`,
      defaultInterval: Duration.days(14),
    });

    dashboard.addWidgets(new cloudwatch.AlarmStatusWidget({ alarms: this.alarms, width: 24, title: "Alarm Status" }));

    this.addApiGatewayWidgets(dashboard, httpApi);
    this.addLambdaWidgets(dashboard, lambdas);
    this.addDynamoDbWidgets(dashboard, tables);
    this.addFirehoseWidgets(dashboard, deliveryStream);
  }

  private addApiGatewayWidgets(dashboard: cloudwatch.Dashboard, httpApi: HttpApi) {
    const dims = { ApiId: httpApi.httpApiId };

    dashboard.addWidgets(new cloudwatch.TextWidget({ markdown: "## API Gateway", width: 24, height: 1 }));

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Requests & Errors",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "Count",
            dimensionsMap: dims,
            statistic: "Sum",
            label: "Requests",
          }),
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "5xx",
            dimensionsMap: dims,
            statistic: "Sum",
            label: "5xx",
          }),
          new cloudwatch.Metric({
            namespace: "AWS/ApiGateway",
            metricName: "4xx",
            dimensionsMap: dims,
            statistic: "Sum",
            label: "4xx",
          }),
        ],
        width: 24,
      }),
    );
  }

  private addLambdaWidgets(dashboard: cloudwatch.Dashboard, lambdas: Function[]) {
    dashboard.addWidgets(new cloudwatch.TextWidget({ markdown: "## Lambda", width: 24, height: 1 }));

    const widgets = lambdas.map(
      (fn) =>
        new cloudwatch.GraphWidget({
          title: fn.functionName,
          left: [fn.metricInvocations({ statistic: "Sum" }), fn.metricErrors({ statistic: "Sum" })],
          width: 8,
        }),
    );
    dashboard.addWidgets(...widgets);
  }

  private addDynamoDbWidgets(dashboard: cloudwatch.Dashboard, tables: ITable[]) {
    dashboard.addWidgets(new cloudwatch.TextWidget({ markdown: "## DynamoDB", width: 24, height: 1 }));

    const widgets = tables.map(
      (table) =>
        new cloudwatch.GraphWidget({
          title: table.tableName,
          left: [
            new cloudwatch.Metric({
              namespace: "AWS/DynamoDB",
              metricName: "ThrottledRequests",
              dimensionsMap: { TableName: table.tableName },
              statistic: "Sum",
              label: "Throttled",
            }),
            new cloudwatch.Metric({
              namespace: "AWS/DynamoDB",
              metricName: "SystemErrors",
              dimensionsMap: { TableName: table.tableName },
              statistic: "Sum",
              label: "System Errors",
            }),
          ],
          width: 8,
        }),
    );
    dashboard.addWidgets(...widgets);
  }

  private addFirehoseWidgets(dashboard: cloudwatch.Dashboard, deliveryStream: CfnDeliveryStream) {
    const dims = { DeliveryStreamName: deliveryStream.ref };

    dashboard.addWidgets(new cloudwatch.TextWidget({ markdown: "## Firehose", width: 24, height: 1 }));

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Incoming Records",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Firehose",
            metricName: "IncomingRecords",
            dimensionsMap: dims,
            statistic: "Sum",
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: "Delivery Freshness",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/Firehose",
            metricName: "DeliveryToS3.DataFreshness",
            dimensionsMap: dims,
            statistic: "Maximum",
          }),
        ],
        width: 12,
      }),
    );
  }

  private addApiGatewayAlarms(httpApi: HttpApi) {
    const dims = { ApiId: httpApi.httpApiId };
    const period = this.period;

    const requests = new cloudwatch.Metric({
      namespace: "AWS/ApiGateway",
      metricName: "Count",
      dimensionsMap: dims,
      statistic: "Sum",
      period,
    });

    this.addRateAlarm("ApiGateway5xxRate", {
      errors: new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "5xx",
        dimensionsMap: dims,
        statistic: "Sum",
        period,
      }),
      total: requests,
      floor: 5,
      threshold: 10,
    });

    this.addRateAlarm("ApiGateway4xxRate", {
      errors: new cloudwatch.Metric({
        namespace: "AWS/ApiGateway",
        metricName: "4xx",
        dimensionsMap: dims,
        statistic: "Sum",
        period,
      }),
      total: requests,
      floor: 10,
      threshold: 30,
    });
  }

  private addLambdaAlarms(lambdas: Function[]) {
    const period = this.period;

    for (const fn of lambdas) {
      const id = fn.node.scope?.node.id ?? fn.node.id;
      this.addRateAlarm(`${id}-ErrorRate`, {
        errors: fn.metricErrors({ statistic: "Sum", period }),
        total: fn.metricInvocations({ statistic: "Sum", period }),
        floor: 5,
        threshold: 10,
      });
    }
  }

  private addDynamoDbAlarms(tables: ITable[]) {
    for (const table of tables) {
      this.addAlarm(
        `${table.node.id}-Throttled`,
        new cloudwatch.Metric({
          namespace: "AWS/DynamoDB",
          metricName: "ThrottledRequests",
          dimensionsMap: { TableName: table.tableName },
          statistic: "Sum",
          period: Duration.minutes(5),
        }),
        0,
      );
    }
  }

  private addFirehoseAlarms(deliveryStream: CfnDeliveryStream) {
    this.addAlarm(
      "FirehoseFreshness",
      new cloudwatch.Metric({
        namespace: "AWS/Firehose",
        metricName: "DeliveryToS3.DataFreshness",
        dimensionsMap: { DeliveryStreamName: deliveryStream.ref },
        statistic: "Maximum",
        period: this.period,
      }),
      900,
    );
  }

  private addRateAlarm(
    id: string,
    opts: { errors: cloudwatch.IMetric; total: cloudwatch.IMetric; floor: number; threshold: number },
  ) {
    const rate = new cloudwatch.MathExpression({
      expression: `IF(total > ${opts.floor}, errors / total * 100, 0)`,
      usingMetrics: { total: opts.total, errors: opts.errors },
      label: `${id} (%)`,
      period: this.period,
    });

    this.addAlarm(id, rate, opts.threshold);
  }

  private addAlarm(id: string, metric: cloudwatch.IMetric, threshold: number) {
    const alarm = new cloudwatch.Alarm(this, id, {
      metric,
      threshold,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    if (this.alarmAction) alarm.addAlarmAction(this.alarmAction);
    this.alarms.push(alarm);
  }

  private addCostCircuitBreaker(props: MonitoringProps) {
    const account = Stack.of(this).account;

    const denyPolicy = new iam.ManagedPolicy(this, "BudgetDenyPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ["lambda:InvokeFunction"],
          resources: ["*"],
        }),
      ],
    });

    const budgetRole = new iam.Role(this, "BudgetActionRole", {
      assumedBy: new iam.ServicePrincipal("budgets.amazonaws.com"),
      inlinePolicies: {
        AttachPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["iam:AttachRolePolicy", "iam:DetachRolePolicy"],
              resources: [`arn:aws:iam::${account}:role/*`],
              conditions: { ArnEquals: { "iam:PolicyARN": denyPolicy.managedPolicyArn } },
            }),
          ],
        }),
      },
    });

    const budget = new budgets.CfnBudget(this, "MonthlyCostBudget", {
      budget: {
        budgetName: "short-as-monthly",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: 20, unit: "USD" },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: "ACTUAL",
            comparisonOperator: "GREATER_THAN",
            threshold: 80,
            thresholdType: "PERCENTAGE",
          },
          subscribers: [{ subscriptionType: "EMAIL", address: props.alarmEmail }],
        },
      ],
    });

    for (const fn of props.lambdas) {
      if (!fn.role) continue;
      const id = fn.node.scope?.node.id ?? fn.node.id;
      new budgets.CfnBudgetsAction(this, `BudgetAction-${id}`, {
        budgetName: budget.ref,
        notificationType: "ACTUAL",
        actionType: "APPLY_IAM_POLICY",
        actionThreshold: { type: "PERCENTAGE", value: 90 },
        executionRoleArn: budgetRole.roleArn,
        approvalModel: "AUTOMATIC",
        definition: {
          iamActionDefinition: {
            policyArn: denyPolicy.managedPolicyArn,
            roles: [fn.role.roleName],
          },
        },
        subscribers: [{ type: "EMAIL", address: props.alarmEmail }],
      });
    }
  }
}
