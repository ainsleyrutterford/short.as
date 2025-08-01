import { Duration, Stack } from "aws-cdk-lib";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeJsLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as glue from "@aws-cdk/aws-glue-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface UrlAnalyticsAggregatorProps {
  urlsTable: dynamodb.Table;
}

export class UrlAnalyticsAggregator extends Construct {
  public deliveryStream: firehose.CfnDeliveryStream;
  private stackName: string;

  constructor(scope: Construct, id: string, props: UrlAnalyticsAggregatorProps) {
    super(scope, id);
    const { urlsTable } = props;

    const { account, stackName } = Stack.of(this);
    this.stackName = stackName;

    const destinationBucket = new s3.Bucket(this, "UrlAnalyticsBucket", {
      bucketName: `url-analytics-${stackName.toLowerCase()}-${account}`,
    });

    // TODO: how do we want to aggregate? What do we want the keys to be?
    // const analyticsAggregationTable = new dynamodb.Table(this, "UrlAnalyticsAggregationTable", {
    //   billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    //   tableName: this.createResourceName("UrlAnalyticsAggregationTable"),
    // });

    const aggregatorLambda = new nodeJsLambda.NodejsFunction(this, "UrlAnalyticsAggregatorLambda", {
      entry: "../lambda/src/handlers/analytics-aggregator.ts",
      functionName: this.createResourceName("UrlAnalyticsAggregatorLambda"),
      runtime: lambda.Runtime.NODEJS_LATEST,
      environment: { URLS_TABLE_NAME: urlsTable.tableName },
      timeout: Duration.seconds(60),
    });

    // analyticsAggregationTable.grantReadWriteData(aggregatorLambda);
    urlsTable.grantReadWriteData(aggregatorLambda);

    const glueDatabase = new glue.Database(this, "UrlAnalyticsDatabase", {});

    const glueTable = new glue.S3Table(this, "UrlAnalyticsTable", {
      database: glueDatabase,
      tableName: "url_analytics_events",
      // If anything in packages/lambda/src/analytics.ts changes, you must change it here too!
      columns: [
        { name: "short_url_id", type: glue.Schema.STRING },
        { name: "timestamp", type: glue.Schema.TIMESTAMP },

        // Device / Browser information
        { name: "user_agent", type: glue.Schema.STRING },
        { name: "is_mobile", type: glue.Schema.BOOLEAN },
        { name: "is_desktop", type: glue.Schema.BOOLEAN },
        { name: "is_tablet", type: glue.Schema.BOOLEAN },
        { name: "is_smart_tv", type: glue.Schema.BOOLEAN },
        { name: "is_android", type: glue.Schema.BOOLEAN },
        { name: "is_ios", type: glue.Schema.BOOLEAN },

        // Geographic data
        { name: "country_code", type: glue.Schema.STRING },
        { name: "country_name", type: glue.Schema.STRING },
        { name: "region_code", type: glue.Schema.STRING },
        { name: "region_name", type: glue.Schema.STRING },
        { name: "city", type: glue.Schema.STRING },
        { name: "postal_code", type: glue.Schema.STRING },
        { name: "latitude", type: glue.Schema.DOUBLE },
        { name: "longitude", type: glue.Schema.DOUBLE },
        { name: "time_zone", type: glue.Schema.STRING },

        // Network information
        { name: "ip_address_hash", type: glue.Schema.STRING },
        { name: "asn", type: glue.Schema.STRING },
        { name: "referer", type: glue.Schema.STRING },
      ],

      partitionKeys: [
        { name: "year", type: glue.Schema.STRING },
        { name: "month", type: glue.Schema.STRING },
        { name: "day", type: glue.Schema.STRING },
        // "aa" to "ZZ" = 52^2 = 2,704 buckets
        { name: "url_prefix_bucket", type: glue.Schema.STRING },
      ],

      // Looks like we need to set it as JSON rather than Parquet:
      // https://medium.com/@prakashabhishant/kinesis-firehose-transformations-with-lambda-data-conversions-and-dynamic-partitioning-aefb189aa2ed
      dataFormat: glue.DataFormat.JSON,
      bucket: destinationBucket,
    });

    const firehoseLogGroup = new logs.LogGroup(this, "UrlAnalyticsFirehoseLogGroup", {
      logGroupName: `/aws/kinesisfirehose/UrlAnalytics-${this.stackName}`,
      retention: logs.RetentionDays.TWO_MONTHS,
    });

    const firehoseLogStream = new logs.LogStream(this, "UrlAnalyticsFirehoseLogStream", {
      logGroup: firehoseLogGroup,
    });

    const firehoseRole = new iam.Role(this, "UrlAnalyticsFirehoseRole", {
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
      inlinePolicies: {
        FirehoseDeliveryPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "s3:AbortMultipartUpload",
                "s3:GetBucketLocation",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:ListBucketMultipartUploads",
                "s3:PutObject",
              ],
              resources: [destinationBucket.bucketArn, destinationBucket.arnForObjects("*")],
            }),
            new iam.PolicyStatement({
              actions: ["glue:GetTable", "glue:GetTableVersion", "glue:GetTableVersions"],
              resources: [glueDatabase.catalogArn, glueDatabase.databaseArn, glueTable.tableArn],
            }),
            new iam.PolicyStatement({
              actions: ["lambda:InvokeFunction", "lambda:GetFunctionConfiguration"],
              resources: [aggregatorLambda.functionArn],
            }),
            new iam.PolicyStatement({ actions: ["logs:PutLogEvents"], resources: [firehoseLogGroup.logGroupArn] }),
          ],
        }),
      },
    });

    this.deliveryStream = new firehose.CfnDeliveryStream(this, "UrlAnalyticsFirehose", {
      deliveryStreamName: this.createResourceName("UrlAnalyticsFirehose"),
      extendedS3DestinationConfiguration: {
        bucketArn: destinationBucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        errorOutputPrefix: "errors/",
        dynamicPartitioningConfiguration: { enabled: true },
        prefix:
          "year=!{partitionKeyFromQuery:year}/month=!{partitionKeyFromQuery:month}/day=!{partitionKeyFromQuery:day}/url_prefix_bucket=!{partitionKeyFromQuery:url_prefix_bucket}/",
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: "Lambda",
              parameters: [{ parameterName: "LambdaArn", parameterValue: aggregatorLambda.functionArn }],
            },
            {
              type: "MetadataExtraction",
              parameters: [
                {
                  parameterName: "MetadataExtractionQuery",
                  parameterValue: "{year:.year,month:.month,day:.day,url_prefix_bucket:.url_prefix_bucket}",
                },
                {
                  parameterName: "JsonParsingEngine",
                  parameterValue: "JQ-1.6",
                },
              ],
            },
          ],
        },
        dataFormatConversionConfiguration: {
          enabled: true,
          // According to docs, we can switch to using GZIP if we want to prioritize compression ratio over speed
          outputFormatConfiguration: { serializer: { parquetSerDe: { compression: "SNAPPY" } } },
          inputFormatConfiguration: { deserializer: { openXJsonSerDe: {} } },
          schemaConfiguration: {
            databaseName: glueDatabase.databaseName,
            tableName: glueTable.tableName,
            roleArn: firehoseRole.roleArn,
          },
        },
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: firehoseLogGroup.logGroupName,
          logStreamName: firehoseLogStream.logStreamName,
        },
      },
    });
  }

  createResourceName(suffix: string) {
    return `${this.stackName}-${suffix}`;
  }
}
