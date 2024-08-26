import { APIGatewayProxyHandlerV2 } from "aws-lambda";
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  createBareBonesDynamoDBDocumentClient,
  encodeNumber,
  getRandomCountBucketId,
  getStringEnvironmentVariable,
  response,
} from "./utils";
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";

interface Body {
  longUrl?: string;
}

const BUCKET_SIZE = 15000000;
const MAX_COUNT = BUCKET_SIZE - 1;

const dynamoClient = createBareBonesDynamoDBDocumentClient();

const updateDynamoDBTableValues = async (countBucketId: number, longUrl: string) => {
  const countBucketsTableName = getStringEnvironmentVariable("COUNT_BUCKETS_TABLE_NAME");
  const urlsTableName = getStringEnvironmentVariable("URLS_TABLE_NAME");

  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: countBucketsTableName,
      ConsistentRead: true,
      Key: { id: countBucketId },
    }),
  );

  const count = Item ? Item.count : 0;

  if (count >= MAX_COUNT) {
    throw new Error(`The count for a bucket cannot exceed ${MAX_COUNT}`);
  }

  const base = countBucketId * BUCKET_SIZE;
  const chosenUrlNumber = base + count;
  const shortUrlId = encodeNumber(chosenUrlNumber);

  // If there was already a count bucket, then update it, otherwise create one
  const countBucketTransactWriteItem = Item
    ? {
        Update: {
          TableName: countBucketsTableName,
          Key: { id: countBucketId },
          UpdateExpression: "ADD #count :one",
          // Ensure this item hasn't been updated in the mean time
          ConditionExpression: "#count = :count",
          ExpressionAttributeNames: {
            "#count": "count",
          },
          ExpressionAttributeValues: {
            ":count": count,
            ":one": 1,
          },
        },
      }
    : {
        Put: {
          TableName: countBucketsTableName,
          // Set the count to 1
          Item: { id: countBucketId, count: 1, base },
          // Ensure this item hasn't been created in the mean time
          ConditionExpression: "attribute_not_exists(id)",
        },
      };

  // Update both tables at the same time using a transaction
  await dynamoClient.send(
    new TransactWriteCommand({
      TransactItems: [
        countBucketTransactWriteItem,
        {
          Put: {
            TableName: urlsTableName,
            Item: { shortUrlId, longUrl, createdAt: new Date().toISOString() },
            // Ensure this item hasn't been created in the mean time
            ConditionExpression: "attribute_not_exists(shortUrlId)",
          },
        },
      ],
    }),
  );

  return shortUrlId;
};

export const createShortUrlHandler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  // Logging the entire event for now
  console.log(event);

  const bodyString = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString() : event.body;
  const { longUrl } = JSON.parse(bodyString ?? "{}") as Body;

  if (!longUrl) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "A longUrl must be provided in the request body" }),
    });
  }

  console.log("Received long URL: ", longUrl);

  const countBucketId = getRandomCountBucketId();

  // There are up to 65536 count buckets, and each counter can reach up to 15,000,000
  console.log("Random count bucket ID chosen: ", countBucketId);

  let attempt = 1;
  let shortUrlId: string;

  while (attempt <= 3) {
    try {
      console.log(`Starting attempt ${attempt} to update the DynamoDB tables...`);

      shortUrlId = await updateDynamoDBTableValues(countBucketId, longUrl);

      console.log("Successfully generated short URL ID: ", shortUrlId);

      return response({ statusCode: 200, body: JSON.stringify({ shortUrlId }) });
    } catch (error) {
      console.error("An error occurred while trying to update the DynamoDB tables: ", error);

      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Class/TransactionCanceledException/
      if (error instanceof TransactionCanceledException) {
        // If it was a transaction cancel due to a race condition, try again
        attempt += 1;
      } else {
        // Otherwise, just return an error
        return response({ statusCode: 500, body: JSON.stringify({ message: "An internal server error occurred" }) });
      }
    }
  }

  // We shouldn't ever reach here so return an error incase
  return response({ statusCode: 500, body: JSON.stringify({ message: "An internal server error occurred" }) });
};
