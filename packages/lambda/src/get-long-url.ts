import { Handler } from 'aws-lambda';
// Make sure to import commands from lib-dynamodb instead of client-dynamodb
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { createBareBonesDynamoDBDocumentClient, getStringEnvironmentVariable } from "./utils";

const dynamoClient = createBareBonesDynamoDBDocumentClient();

export const getLongUrlHandler: Handler = async (event, context) => {
  const { shortUrlId } = event;

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

  return longUrl;
};
