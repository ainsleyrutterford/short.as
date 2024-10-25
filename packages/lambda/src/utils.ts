import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export const getStringEnvironmentVariable = (name: string) => {
  const environmentVariable = process.env[name];
  if (environmentVariable === undefined) {
    throw new Error(`Environment variable ${name} undefined`);
  }
  return environmentVariable;
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

export const response = (value: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 => {
  console.log(`Returning response: ${JSON.stringify(value)}`);
  return value;
};

/**
 * Returns a random value x where 0 <= x < 1.
 */
const randomDecimalValue = () => crypto.randomInt(2 ** 16) / 2 ** 16;

/**
 * The max time a retry can wait in milliseconds.
 */
const MAX_BACKOFF = 10000;

/**
 * Returns the number of milliseconds that should be waited before the next attempt.
 *
 * Normally the AWS SDK deals with the retry strategy for us, but since we are implementing our
 * own retry logic where we fetch the item again, we have implemented our own backoff strategy.
 *
 * - https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html#standardvsadaptiveimplementation
 */
export const exponentialBackoffWithJitter = (attempt: number) =>
  Math.min(1000 * (randomDecimalValue() * 2) ** attempt, MAX_BACKOFF);

// eslint-disable-next-line no-promise-executor-return
export const wait = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));
