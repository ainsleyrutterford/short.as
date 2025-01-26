import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { getStringEnvironmentVariable, response } from "../utils";
import { dynamoClient } from "../clients/dynamo";

interface PathParameters {
  shortUrlId?: string;
}

export const getLongUrl = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2 | string> => {
  const { shortUrlId } = event.pathParameters as PathParameters;

  if (!shortUrlId) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "A shortUrlId must be provided in the request path parameters" }),
    });
  }

  console.log("Received short URL ID: ", shortUrlId);

  const urlsTableName = getStringEnvironmentVariable("URLS_TABLE_NAME");

  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: urlsTableName,
      Key: { shortUrlId },
    }),
  );

  if (!Item) {
    return response({
      statusCode: 404,
      body: JSON.stringify({ message: `Could not find a long URL from the shortUrlId: ${shortUrlId}` }),
    });
  }

  const { longUrl } = Item;

  console.log("Successfully fetched long URL: ", longUrl);

  return longUrl as string;
};

export const getLongUrlDetailsHandler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  console.log(event);
  const maybeLongUrl = await getLongUrl(event);
  return typeof maybeLongUrl === "string"
    ? response({ statusCode: 200, body: JSON.stringify({ longUrl: maybeLongUrl }) })
    : maybeLongUrl;
};

export const getLongUrlHandler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  console.log(event);
  const maybeLongUrl = await getLongUrl(event);
  return typeof maybeLongUrl === "string"
    ? response({ statusCode: 302, headers: { Location: maybeLongUrl } })
    : maybeLongUrl;
};
