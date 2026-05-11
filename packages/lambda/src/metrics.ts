import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { cloudWatchClient } from "./clients/cloudwatch";

const NAMESPACE = "short.as";

export const publishMetric = (metricName: string, value: number, dimensions: Record<string, string> = {}) =>
  cloudWatchClient.send(
    new PutMetricDataCommand({
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: metricName,
          Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
          Value: value,
          Unit: "Count",
        },
      ],
    }),
  );

export const publishCorruptBucketMetric = (client: CloudWatchClient, countBucketId: number) => {
  console.log(`Publishing corrupt bucket metric for countBucketId: ${countBucketId}`);
  return client.send(
    new PutMetricDataCommand({
      MetricData: [{ MetricName: "CorruptBucketFound", Value: 1 }],
      Namespace: NAMESPACE,
    }),
  );
};
