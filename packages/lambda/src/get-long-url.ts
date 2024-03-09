import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createBareBonesDynamoDBDocumentClient, getStringEnvironmentVariable } from "./utils";

type PathParameters = {
  shortUrlId?: string;
};

const dynamoClient = createBareBonesDynamoDBDocumentClient();

export const getLongUrlHandler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const { shortUrlId } = event.pathParameters as PathParameters;

  if (!shortUrlId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'a shortUrlId must be provided in the request path parameters' }) };
  }

  console.log('Entered handler.');
  console.log('Short URL ID: ', shortUrlId);

  const urlsTableName = getStringEnvironmentVariable('URLS_TABLE_NAME');

  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: urlsTableName,
      Key: { shortUrlId },
    })
  );

  if (!Item) {
    throw new Error("Could not find a long URL for that short URL ID");
  }

  const { longUrl } = Item;

  console.log(longUrl);
  console.log('Done!');

  return { statusCode: 302, headers: { Location: longUrl } };
};
