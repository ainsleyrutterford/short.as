import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { endpoint } from "./config";

const createCloudWatchClient = () => {
  console.log("Creating CloudWatch client...");
  return new CloudWatchClient({ endpoint });
};

export const cloudWatchClient = createCloudWatchClient();
