import { APIGatewayProxyHandlerV2 } from "aws-lambda";
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createBareBonesDynamoDBDocumentClient, getStringEnvironmentVariable, response } from "./utils";

interface PathParameters {
  shortUrlId?: string;
}

const dynamoClient = createBareBonesDynamoDBDocumentClient();

export const getLongUrlHandler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  // Logging the entire event for now
  console.log(event);

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

  return response({ statusCode: 302, headers: { Location: longUrl } });
};
