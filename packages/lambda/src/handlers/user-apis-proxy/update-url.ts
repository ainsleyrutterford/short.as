import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ReturnValue } from "@aws-sdk/client-dynamodb";

import { BadRequest, Forbidden, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { getStringEnvironmentVariable, parseBody, response } from "../../utils";
import { dynamoClient } from "../../clients/dynamo";
import { Url } from "@short-as/types";
import { checkUserOwnsUrl } from "./get-url-views";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

interface Body {
  longUrl?: string;
}

const updateUrlItem = async (shortUrlId: string, longUrl: string) => {
  const response = await dynamoClient.send(
    new UpdateCommand({
      TableName: URLS_TABLE_NAME,
      Key: { shortUrlId },
      UpdateExpression: "SET longUrl = :longUrl, updatedTimestamp = :now",
      ExpressionAttributeValues: {
        ":longUrl": longUrl,
        ":now": new Date().toISOString(),
      },
      ReturnValues: ReturnValue.ALL_NEW,
    }),
  );

  if (!response.Attributes) {
    throw new Error(`Could not update URL with id: ${shortUrlId}`);
  }

  return response.Attributes as Url;
};

export const updateUrlDetails: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  const shortUrlId = event.pathParameters?.shortUrlId;
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  const userOwnsUrl = await checkUserOwnsUrl(userId, shortUrlId);
  if (!userOwnsUrl) throw new Forbidden("You do not own this URL");

  console.log(`Updating details about URL ${shortUrlId} owned by ${userId}`);

  const { longUrl } = parseBody(event) as Body;
  if (!longUrl) throw new BadRequest("A longUrl must be provided in the request body");

  const urlItem = await updateUrlItem(shortUrlId, longUrl);

  return response({ statusCode: 200, body: JSON.stringify(urlItem) });
};
