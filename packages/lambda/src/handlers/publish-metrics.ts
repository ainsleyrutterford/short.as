import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { dynamoClient } from "../clients/dynamo";
import { cloudWatchClient } from "../clients/cloudwatch";
import { getStringEnvironmentVariable } from "../utils";

const TABLE_NAMES = getStringEnvironmentVariable("TABLE_NAMES").split(",");

export const handler = async () => {
  const metricData = await Promise.all(
    TABLE_NAMES.map(async (tableName: string) => {
      const { Table } = await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      return {
        MetricName: "ItemCount",
        Dimensions: [{ Name: "TableName", Value: tableName }],
        Value: Table?.ItemCount ?? 0,
        Unit: "Count" as const,
      };
    }),
  );

  await cloudWatchClient.send(new PutMetricDataCommand({ Namespace: "short.as", MetricData: metricData }));

  console.log(`Published item counts for ${TABLE_NAMES.length} tables`);
};
