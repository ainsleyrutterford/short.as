import { FirehoseTransformationEventRecord, FirehoseTransformationHandler } from "aws-lambda";
import { AnalyticsEvent } from "../analytics";
import { dynamoClient } from "../clients/dynamo";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getStringEnvironmentVariable } from "../utils";
import { AggregationGranularity } from "@short-as/types";
import { nowInSeconds } from "../oauth/utils";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");
const AGGREGATION_TABLE_NAME = getStringEnvironmentVariable("AGGREGATION_TABLE_NAME");

const groupEventsByShortUrlId = (records: FirehoseTransformationEventRecord[]) => {
  const shortUrlAnalytics = new Map<string, AnalyticsEvent[]>();
  for (const record of records) {
    const event: AnalyticsEvent = JSON.parse(Buffer.from(record.data, "base64").toString());
    const events = shortUrlAnalytics.get(event.short_url_id) ?? [];
    events.push(event);
    shortUrlAnalytics.set(event.short_url_id, events);
  }
  return shortUrlAnalytics;
};

/**
 * Using a simple atomic counter for now without retries so we may undercount. See:
 * https://aws.amazon.com/blogs/database/implement-resource-counters-with-amazon-dynamodb/
 */
const updateUrlViewCount = async (shortUrlId: string, countIncrease: number): Promise<"success" | Error> => {
  try {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: URLS_TABLE_NAME,
        Key: { shortUrlId },
        // Ensures that we don't create a new item if it didn't already exist, we only update existing ones
        ConditionExpression: "attribute_exists(shortUrlId)",
        // TODO: update clicks and qrCodeScans attributes here too
        UpdateExpression: "ADD totalVisits :increment",
        ExpressionAttributeValues: { ":increment": countIncrease },
      }),
    );
    return "success";
  } catch (error) {
    return error as Error;
  }
};

const updateUrlViewCounts = async (shortUrlAnalytics: Map<string, AnalyticsEvent[]>) => {
  const results = await Promise.all(
    Array.from(shortUrlAnalytics.entries()).map(([shortUrlId, analyticsEvents]) =>
      updateUrlViewCount(shortUrlId, analyticsEvents.length),
    ),
  );

  const successes = results.filter((result) => result === "success");
  const errors = results.filter((result) => result !== "success");

  return { successes, errors };
};

const compileIncrements = (analyticsEvents: AnalyticsEvent[]): Map<string, number> => {
  const increments = new Map<string, number>();
  for (const { location, device, simplified_referer } of analyticsEvents) {
    const combination = `${(location || "other").toLowerCase()}_${device || "other"}_${simplified_referer || "other"}`;
    increments.set(combination, (increments.get(combination) ?? 0) + 1);
  }
  return increments;
};

const DAY_SECONDS = 24 * 60 * 60;

const getTtlOffset = (granularity: AggregationGranularity) => {
  if (granularity === "week") return 2 * 365 * DAY_SECONDS;
  if (granularity === "day") return 90 * DAY_SECONDS;
  // (granularity === "hour")
  return 30 * DAY_SECONDS;
};

export const getTimeBucket = (granularity: AggregationGranularity, timestamp: string) => {
  const d = new Date(timestamp);
  d.setUTCMinutes(0, 0, 0);
  if (granularity === "hour") return d.toISOString();
  d.setUTCHours(0);
  if (granularity === "day") return d.toISOString();
  // Monday start
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString();
};

const buildComboExpressions = (increments: Map<string, number>) => {
  const names: Record<string, string> = {};
  const values: Record<string, number> = {};
  const addClauses: string[] = [];
  let total = 0;

  for (const [combo, count] of increments) {
    names[`#${combo}`] = combo;
    values[`:${combo}`] = count;
    addClauses.push(`#${combo} :${combo}`);
    total += count;
  }

  return { names, values, addClauses, total };
};

const upsertAggregation = async (
  granularity: AggregationGranularity,
  shortUrlId: string,
  owningUserId: string,
  timeBucket: string,
  increments: Map<string, number>,
) => {
  const { names, values, addClauses, total } = buildComboExpressions(increments);
  if (total === 0) {
    console.error(`Skipping aggregation for ${granularity}_${shortUrlId} - no increments`);
    return;
  }

  const addExpression = addClauses.length > 0 ? `ADD #views :total, ${addClauses.join(", ")}` : `ADD #views :total`;

  await dynamoClient.send(
    new UpdateCommand({
      TableName: AGGREGATION_TABLE_NAME,
      Key: { pk: `${granularity}_${shortUrlId}`, sk: timeBucket },
      UpdateExpression: `${addExpression} SET #ttl = if_not_exists(#ttl, :ttl), #uid = if_not_exists(#uid, :uid)`,
      ExpressionAttributeNames: { ...names, "#views": "views", "#ttl": "ttl", "#uid": "owningUserId" },
      ExpressionAttributeValues: {
        ...values,
        ":total": total,
        ":ttl": nowInSeconds() + getTtlOffset(granularity),
        ":uid": owningUserId,
      },
    }),
  );
};

const groupByTimeBucket = (granularity: AggregationGranularity, events: AnalyticsEvent[]) => {
  const buckets = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const bucket = getTimeBucket(granularity, event.timestamp);
    const arr = buckets.get(bucket) ?? [];
    arr.push(event);
    buckets.set(bucket, arr);
  }
  return buckets;
};

const updateUrlViewAggregation = async (
  shortUrlId: string,
  owningUserId: string,
  analyticsEvents: AnalyticsEvent[],
): Promise<"success" | Error> => {
  try {
    for (const granularity of ["hour", "day", "week"] as const) {
      for (const [timeBucket, events] of groupByTimeBucket(granularity, analyticsEvents)) {
        const increments = compileIncrements(events);
        await upsertAggregation(granularity, shortUrlId, owningUserId, timeBucket, increments);
      }
    }
    return "success";
  } catch (error) {
    return error as Error;
  }
};

const updateUrlViewAggregations = async (shortUrlAnalytics: Map<string, AnalyticsEvent[]>) => {
  const results = await Promise.all(
    Array.from(shortUrlAnalytics.entries()).map(([shortUrlId, analyticsEvents]) => {
      const owningUserId = analyticsEvents[0]?.owning_user_id;
      // Skip aggregating URL views for unowned URLs
      if (!owningUserId) return "skip";
      return updateUrlViewAggregation(shortUrlId, owningUserId, analyticsEvents);
    }),
  );

  const successes = results.filter((result) => result === "success");
  const skips = results.filter((result) => result === "skip");
  const errors = results.filter((result) => result !== "success" && result !== "skip");

  return { successes, skips, errors };
};

export const handler: FirehoseTransformationHandler = async (event) => {
  const shortUrlAnalytics = groupEventsByShortUrlId(event.records);

  const { successes, errors } = await updateUrlViewCounts(shortUrlAnalytics);
  const {
    successes: aggSuccesses,
    skips: aggSkips,
    errors: aggErrors,
  } = await updateUrlViewAggregations(shortUrlAnalytics);

  console.log(
    `Processed ${event.records.length} events for ${shortUrlAnalytics.size} URLs. ` +
      `Counts: ${successes.length} succeeded, ${errors.length} failed. ` +
      `Aggregations: ${aggSuccesses.length} succeeded, ${aggSkips.length} skipped, ${aggErrors.length} failed.`,
  );

  if (errors.length > 0) console.error(`Count errors: ${JSON.stringify(errors, null, 2)}`);
  if (aggErrors.length > 0) console.error(`Aggregation errors: ${JSON.stringify(aggErrors, null, 2)}`);

  return {
    records: event.records.map(({ recordId, data }) => ({
      recordId,
      result: "Ok",
      data,
    })),
  };
};
