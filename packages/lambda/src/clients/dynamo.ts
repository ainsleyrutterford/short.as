import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const createBareBonesDynamoDBDocumentClient = () => {
  console.log("Creating a barebones DynamoDB client...");
  // Bare-bones DynamoDB Client for smaller bundle sizes:
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/introduction/#high-level-concepts
  const dynamoClient = new DynamoDBClient({});
  // The document client simplifies working with items by abstracting away the notion of attribute values
  // https://www.npmjs.com/package/@aws-sdk/lib-dynamodb
  return DynamoDBDocumentClient.from(dynamoClient);
};

export const dynamoClient = createBareBonesDynamoDBDocumentClient();
