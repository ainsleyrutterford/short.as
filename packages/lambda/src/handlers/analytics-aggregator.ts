import { FirehoseTransformationEventRecord, FirehoseTransformationHandler } from "aws-lambda";
import { AnalyticsEvent } from "../analytics";
import { dynamoClient } from "../clients/dynamo";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getStringEnvironmentVariable } from "../utils";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

const groupEventsByShortUrlId = (records: FirehoseTransformationEventRecord[]) => {
  const shortUrlAnalytics = new Map<string, AnalyticsEvent[]>();
  for (const record of records) {
    const analytics: AnalyticsEvent = JSON.parse(Buffer.from(record.data, "base64").toString());
    if (shortUrlAnalytics.has(analytics.short_url_id)) {
      shortUrlAnalytics.get(analytics.short_url_id)?.push(analytics);
    } else {
      shortUrlAnalytics.set(analytics.short_url_id, [analytics]);
    }
  }
  return shortUrlAnalytics;
};

/**
 * Using a simple atomic counter for now without retries so we underapply. See:
 * https://aws.amazon.com/blogs/database/implement-resource-counters-with-amazon-dynamodb/
 */
const updateUrlCount = async (shortUrlId: string, countIncrease: number): Promise<"success" | Error> => {
  try {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: URLS_TABLE_NAME,
        Key: { shortUrlId },
        UpdateExpression: "ADD totalVisits :increment",
        ExpressionAttributeValues: { ":increment": countIncrease },
      }),
    );
    return "success";
  } catch (error) {
    return error as Error;
  }
};

const updateUrlCounts = async (shortUrlAnalytics: Map<string, AnalyticsEvent[]>) => {
  const results = await Promise.all(
    Array.from(shortUrlAnalytics.entries()).map(([shortUrlId, analyticsEvents]) =>
      updateUrlCount(shortUrlId, analyticsEvents.length),
    ),
  );

  const successes = results.filter((result) => result === "success");
  const errors = results.filter((result) => result !== "success");

  return { successes, errors };
};

export const handler: FirehoseTransformationHandler = async (event) => {
  const shortUrlAnalytics = groupEventsByShortUrlId(event.records);
  console.log(`Received ${event.records.length} events for ${shortUrlAnalytics.size} short URLs`);

  const { successes, errors } = await updateUrlCounts(shortUrlAnalytics);

  console.log(
    `Updated counts for ${successes.length + errors.length} short URLs. ` +
      `Successes: ${successes.length}, errors: ${errors.length}`,
  );

  if (errors.length > 0) console.error(`Errors: ${JSON.stringify(errors, null, 2)}`);

  // TODO: update DynamoDB aggregations

  return {
    records: event.records.map(({ recordId, data }) => ({
      recordId,
      result: "Ok",
      data,
    })),
  };
};
