import crypto from "crypto";
import { Handler } from 'aws-lambda';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { encodeNumber } from "./encode";

const MAX_COUNT = 15000000;

const getStringEnvironmentVariable = (name: string) => {
  const environmentVariable = process.env[name];
  if (environmentVariable === undefined) {
    throw new Error(`Environment variable ${name} undefined`);
  }
  return environmentVariable;
}

// Bare-bones DynamoDB Client for smaller bundle sizes:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/introduction/#high-level-concepts
const dynamoClient = new DynamoDBClient({});
// The document client simplifies working with items by abstracting away the notion of attribute values
// https://www.npmjs.com/package/@aws-sdk/lib-dynamodb
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export const hexStringToNumber = (hex: string) => Number(`0x${hex}`);

export const handler: Handler = async (event, context) => {
  const { longUrl } = event;

  console.log('Entered test handler.');
  console.log('Long URL: ', longUrl);

  const hash = crypto.createHash("sha256").update(longUrl).digest("hex");

  // 16^4 = 65,536 possible short hashes
  const shortHash = hash.slice(0, 4);
  // A number between 0 and 65,535
  const countBucketId = hexStringToNumber(shortHash);

  // Each counter can reach up to 15,000,000
  console.log(countBucketId);

  const countBucketsTableName = getStringEnvironmentVariable('COUNT_BUCKETS_TABLE_NAME');

  const { Item } = await dynamoDocClient.send(
    new GetCommand({
      TableName: countBucketsTableName,
      ConsistentRead: true,
      Key: { id: countBucketId },
    })
  );

  let count: number;
  const base = countBucketId * MAX_COUNT;

  if (Item) {
    count = Item.count;

    if (count >= MAX_COUNT - 1) {
      throw new Error(`The count for a bucket cannot exceed ${MAX_COUNT - 1}`);
    }
  } else {
    count = 0;
  }

  const chosenUrlNumber = base + count;
  const shortUrl = encodeNumber(chosenUrlNumber);

  if (Item) {
    // Transact write items and write the shortUrl to it's table here too
    await dynamoDocClient.send(
      new UpdateCommand({
        TableName: countBucketsTableName,
        Key: { id: countBucketId },
        UpdateExpression: "ADD #count :one",
        // Ensure this item hasn't been updated in the mean time
        ConditionExpression: "#count = :count",
        ExpressionAttributeNames: {
          "#count": 'count',
        },
        ExpressionAttributeValues: {
          ":count": count,
          ":one": 1,
        },
      })
    );
  } else {
    await dynamoDocClient.send(
      new PutCommand({
        TableName: countBucketsTableName,
        // Set the count to 1
        Item: { id: countBucketId, count: 1, base },
        // Ensure this item hasn't been created in the mean time
        ConditionExpression: "attribute_not_exists(id)",
      })
    );
  }

  console.log(chosenUrlNumber);
  console.log(shortUrl);
  console.log('Done!');

  return shortUrl;
};

// const createShortUrl = (longUrl: string) => {
// };

// const serveLongUrlRedirect = (shortUrl: string) => {
//   // Fetch the long URL from the cache (Redis) or DynamoDB. Look into types of caching for DynamoDB. (Look out for pricing!)
//   // Return a 302 response to the long URL
// };
