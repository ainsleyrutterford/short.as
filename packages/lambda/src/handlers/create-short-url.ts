// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { TransactionCanceledException } from "@aws-sdk/client-dynamodb";
import httpErrorHandler from "@middy/http-error-handler";
import { Url } from "@short-as/types";

import { BUCKET_SIZE, getRandomCountBucketId, MAX_COUNT } from "../buckets";
import { encodeNumber } from "../encoding";
import { publishCorruptBucketMetric } from "../metrics";
import { exponentialBackoffWithJitter, getStringEnvironmentVariable, parseBody, response, wait } from "../utils";
import { dynamoClient } from "../clients/dynamo";
import { cloudWatchClient } from "../clients/cloudwatch";
import { BadRequest, InternalServerError, ServiceUnavailable } from "../errors";
import { logResponse, middy, warmup } from "../middlewares";
import { Handler } from "../types";

const COUNT_BUCKETS_TABLE_NAME = getStringEnvironmentVariable("COUNT_BUCKETS_TABLE_NAME");
const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

interface Body {
  longUrl?: string;
}

const MAX_ATTEMPTS = 3;

const createUrlItem = (shortUrlId: string, longUrl: string, owningUserId?: string): Url => ({
  shortUrlId,
  longUrl,
  owningUserId,
  clicks: 0,
  totalVisits: 0,
  qrCodeScans: 0,
  createdTimestamp: new Date().toISOString(),
  updatedTimestamp: new Date().toISOString(),
});

const updateDynamoDBTableValues = async (countBucketId: number, longUrl: string, owningUserId?: string) => {
  const { Item } = await dynamoClient.send(
    new GetCommand({ TableName: COUNT_BUCKETS_TABLE_NAME, Key: { id: countBucketId } }),
  );

  const count: number = Item ? Item.count : 0;

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
          TableName: COUNT_BUCKETS_TABLE_NAME,
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
          TableName: COUNT_BUCKETS_TABLE_NAME,
          // Set the count to 1
          Item: { id: countBucketId, count: 1 },
          // Ensure this item hasn't been created in the mean time
          ConditionExpression: "attribute_not_exists(id)",
        },
      };

  // Update both tables at the same time using a transaction
  await dynamoClient.send(
    new TransactWriteCommand({
      // The order of this Transactions array matters for the `foundCorruptBucket` function below
      TransactItems: [
        countBucketTransactWriteItem,
        {
          Put: {
            TableName: URLS_TABLE_NAME,
            Item: createUrlItem(shortUrlId, longUrl, owningUserId),
            // Ensure this item hasn't been created in the mean time
            ConditionExpression: "attribute_not_exists(shortUrlId)",
          },
        },
      ],
    }),
  );

  return shortUrlId;
};

/**
 * If we are attempting to create a short URL and the countBucketTable does not have a
 * `ConditionalCheckFailed` but the urlTables does, then every time this bucket is chosen,
 * the request will fail again. We alarm if we find this case as we need to manually increment the
 * bucket's counter. Since we use transactions for creating the items in the two tables, this *should*
 * never happen, but it can happen if we change the count bucket sizes for example (I've actually
 * done that once already, so there are probably a handful of corrupt buckets out there,
 * but I won't do it again!).
 *
 * TODO: clean up the databases so far
 */
const foundCorruptBucket = (error: TransactionCanceledException) =>
  error.CancellationReasons?.[0]?.Code === "None" && error.CancellationReasons?.[1]?.Code !== "None";

export const createShortUrl = async (longUrl: string, owningUserId?: string) => {
  console.log("Received long URL: ", longUrl);

  const countBucketId = getRandomCountBucketId();

  console.log("Random count bucket ID chosen: ", countBucketId);

  let attempt = 1;
  let shortUrlId: string;

  while (attempt <= MAX_ATTEMPTS) {
    try {
      console.log(`Starting attempt ${attempt} to update the DynamoDB tables...`);

      shortUrlId = await updateDynamoDBTableValues(countBucketId, longUrl, owningUserId);

      console.log("Successfully generated short URL ID: ", shortUrlId);

      return shortUrlId;
    } catch (error) {
      console.error("An error occurred while trying to update the DynamoDB tables: ", error);

      // If it was a transaction canceled due to a race condition, try again
      // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-dynamodb/Class/TransactionCanceledException/
      if (error instanceof TransactionCanceledException) {
        if (foundCorruptBucket(error)) {
          await publishCorruptBucketMetric(cloudWatchClient, countBucketId);
          console.error(`Found a corrupt bucket whose count must be incremented manually: ${countBucketId}`);
          throw new InternalServerError();
        }
        attempt += 1;
        if (attempt > MAX_ATTEMPTS) {
          throw new ServiceUnavailable();
        }
        // https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html#standardvsadaptiveimplementation
        const delay = exponentialBackoffWithJitter(attempt);
        console.log(`Waiting ${(delay / 1000).toFixed(2)} seconds before next attempt...`);
        await wait(delay);
      } else {
        // Otherwise, just throw an error
        throw new InternalServerError();
      }
    }
  }

  // We shouldn't ever reach here so throw an error incase
  throw new InternalServerError();
};

export const createShortUrlHandler: Handler = async (event) => {
  // Logging the entire event for now
  console.log(event);

  const { longUrl } = parseBody(event) as Body;
  if (!longUrl) throw new BadRequest("A longUrl must be provided in the request body");

  const shortUrlId = await createShortUrl(longUrl);
  return response({ statusCode: 200, body: JSON.stringify({ shortUrlId }) });
};

export const handler = middy().use(warmup()).use(httpErrorHandler()).use(logResponse()).handler(createShortUrlHandler);
