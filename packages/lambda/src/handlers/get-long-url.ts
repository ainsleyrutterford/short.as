// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import httpErrorHandler from "@middy/http-error-handler";

import { getStringEnvironmentVariable, response } from "../utils";
import { dynamoClient } from "../clients/dynamo";
import { logResponse, middy, warmup } from "../middlewares";
import { BadRequest, NotFound } from "../errors";
import { Handler } from "../types";
import { extractAndPublishAnalytics } from "../analytics";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

const extractShortUrl = (proxy?: string): string | undefined => proxy?.replace("/details", "");

/**
 * This handler is a proxy handler for `/urls/{proxy+}` and is currently used for:
 * - `/urls/{shortUrlId}`
 * - `/urls/{shortUrlId}/details`
 */
export const getLongUrlHandler: Handler = async (event) => {
  const shortUrlId = extractShortUrl(event.pathParameters?.proxy);
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  console.log("Received short URL ID: ", shortUrlId);

  const { Item } = await dynamoClient.send(new GetCommand({ TableName: URLS_TABLE_NAME, Key: { shortUrlId } }));
  const { longUrl } = Item ?? {};
  if (!longUrl) throw new NotFound(`Could not find a long URL from the shortUrlId: ${shortUrlId}`);

  await extractAndPublishAnalytics(shortUrlId, event.headers);

  if (event.pathParameters?.proxy?.endsWith("/details")) {
    return response({ statusCode: 200, body: JSON.stringify({ longUrl }) });
  }

  return response({ statusCode: 302, headers: { Location: longUrl } });
};

export const handler = middy().use(warmup()).use(httpErrorHandler()).use(logResponse()).handler(getLongUrlHandler);
