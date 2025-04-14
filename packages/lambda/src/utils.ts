import crypto from "crypto";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export const getStringEnvironmentVariable = (name: string) => {
  const environmentVariable = process.env[name];
  if (environmentVariable === undefined) {
    throw new Error(`Environment variable ${name} undefined`);
  }
  return environmentVariable;
};

export const isProd = process.env.IS_PROD === "true";

export const siteUrl = isProd ? "https://short.as" : "https://dev.short.as";

export const response = (value: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 => {
  console.log(`Returning response: ${JSON.stringify(value)}`);
  return value;
};

export const parseBody = (event: APIGatewayProxyEventV2) => {
  const bodyString = event.isBase64Encoded ? Buffer.from(event.body ?? "", "base64").toString() : event.body;
  return JSON.parse(bodyString ?? "{}");
};

interface WarmingEvent {
  warming?: boolean;
}

/**
 * If a warming event is received then return early, otherwise call the wrapped handler
 */
export const warmingWrapper =
  (handler: APIGatewayProxyHandlerV2): APIGatewayProxyHandlerV2 =>
  async (event, context, callback): Promise<APIGatewayProxyResultV2> => {
    if ((event as WarmingEvent).warming) return response({ body: "Warming event handled" });
    return handler(event, context, callback) ?? response({ body: "Callback event handled" });
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
