import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getStringEnvironmentVariable, response, warmingWrapper } from "../utils";
import { dynamoClient } from "../clients/dynamo";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

const extractShortUrl = (proxy?: string): string | undefined => proxy?.replace("/details", "");

/**
 * This handler is a proxy handler for `/urls/{proxy+}` and is currently used for:
 * - `/urls/{shortUrlId}`
 * - `/urls/{shortUrlId}/details`
 */
export const handler = warmingWrapper(async (event, _context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    // Logging the entire event for now
    console.log(event);

    const shortUrlId = extractShortUrl(event.pathParameters?.proxy);

    if (!shortUrlId) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: "A shortUrlId must be provided in the request path parameters" }),
      });
    }

    console.log("Received short URL ID: ", shortUrlId);

    const { Item } = await dynamoClient.send(new GetCommand({ TableName: URLS_TABLE_NAME, Key: { shortUrlId } }));

    if (!Item) {
      return response({
        statusCode: 404,
        body: JSON.stringify({ message: `Could not find a long URL from the shortUrlId: ${shortUrlId}` }),
      });
    }

    const { longUrl } = Item;

    if (event.pathParameters?.proxy?.endsWith("/details")) {
      return response({ statusCode: 200, body: JSON.stringify({ longUrl }) });
    }

    return response({ statusCode: 302, headers: { Location: longUrl } });
  } catch (error) {
    console.error(error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: "An internal server error occurred while handling the request" }),
    });
  }
});
