import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";

const createCloudWatchClient = () => {
  console.log("Creating CloudWatch client...");
  return new CloudWatchClient();
};

export const cloudWatchClient = createCloudWatchClient();
