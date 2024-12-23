import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SSMClient } from "@aws-sdk/client-ssm";

const createCloudWatchClient = () => {
  console.log("Creating CloudWatch client...");
  return new CloudWatchClient();
};

export const createBareBonesDynamoDBDocumentClient = () => {
  console.log("Creating a barebones DynamoDB client...");
  // Bare-bones DynamoDB Client for smaller bundle sizes:
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/introduction/#high-level-concepts
  const dynamoClient = new DynamoDBClient({});
  // The document client simplifies working with items by abstracting away the notion of attribute values
  // https://www.npmjs.com/package/@aws-sdk/lib-dynamodb
  return DynamoDBDocumentClient.from(dynamoClient);
};

const createSSMClient = () => {
  console.log("Creating SSM client...");
  return new SSMClient();
};

export const cloudWatchClient = createCloudWatchClient();
export const dynamoClient = createBareBonesDynamoDBDocumentClient();
export const ssmClient = createSSMClient();
