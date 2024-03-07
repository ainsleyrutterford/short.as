import { Handler } from 'aws-lambda';
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { createBareBonesDynamoDBDocumentClient, encodeNumber, getCountBucketId, getStringEnvironmentVariable } from "./utils";

const BUCKET_SIZE = 15000000;
const MAX_COUNT = BUCKET_SIZE - 1;

const dynamoClient = createBareBonesDynamoDBDocumentClient();

export const createShortUrlHandler: Handler = async (event, context) => {
  const { longUrl } = event;

  console.log('Entered test handler.');
  console.log('Long URL: ', longUrl);

  const countBucketId = getCountBucketId(longUrl);

  // Each counter can reach up to 15,000,000
  console.log(countBucketId);

  const countBucketsTableName = getStringEnvironmentVariable('COUNT_BUCKETS_TABLE_NAME');
  const urlsTableName = getStringEnvironmentVariable('URLS_TABLE_NAME');

  // TODO: wrap from here downwards in a try/catch with 2 retries when we encounter
  // TODO: one of the errors that would be thrown if there was a race condition
  // TODO: TransactionCanceledException: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Class/TransactionCanceledException/

  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: countBucketsTableName,
      ConsistentRead: true,
      Key: { id: countBucketId },
    })
  );

  const count = Item ? Item.count : 0;

  if (count >= MAX_COUNT) {
    throw new Error(`The count for a bucket cannot exceed ${MAX_COUNT}`);
  }

  const base = countBucketId * BUCKET_SIZE;
  const chosenUrlNumber = base + count;
  const shortUrlId = encodeNumber(chosenUrlNumber);

  // If there was already a count bucket, then update it, otherwise create one
  const countBucketTransactWriteItem = Item ?
    {
      Update: {
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
      }
    } : {
      Put: {
        TableName: countBucketsTableName,
        // Set the count to 1
        Item: { id: countBucketId, count: 1, base },
        // Ensure this item hasn't been created in the mean time
        ConditionExpression: "attribute_not_exists(id)",
      }
    };

  // Update both tables at the same time using a transaction
  await dynamoClient.send(
    new TransactWriteCommand({
      TransactItems: [
        countBucketTransactWriteItem,
        {
          Put: {
            TableName: urlsTableName,
            Item: { shortUrlId, longUrl, createdAt: (new Date()).toISOString() },
            // Ensure this item hasn't been created in the mean time
            ConditionExpression: "attribute_not_exists(shortUrlId)",
          }
        },
      ]
    })
  );

  console.log(chosenUrlNumber);
  console.log(shortUrlId);
  console.log('Done!');

  return shortUrlId;
};
