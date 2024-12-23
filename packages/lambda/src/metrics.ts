import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const METRIC_NAMESPACE = "short.as";

export const publishCorruptBucketMetric = (client: CloudWatchClient, countBucketId: number) => {
  console.log(`Publishing corrupt bucket metric for countBucketId: ${countBucketId}`);
  return client.send(
    new PutMetricDataCommand({
      MetricData: [{ MetricName: "CorruptBucketFound", Value: 1 }],
      Namespace: METRIC_NAMESPACE,
    }),
  );
};
