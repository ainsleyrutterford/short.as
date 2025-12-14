import { BadRequest, Forbidden, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { getStringEnvironmentVariable, response } from "../../utils";
import { dynamoClient } from "../../clients/dynamo";
import { checkUserOwnsUrl } from "./get-url-views";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

const softDeleteUrlItem = async (shortUrlId: string) => {
  await dynamoClient.send(
    new UpdateCommand({
      TableName: URLS_TABLE_NAME,
      Key: { shortUrlId },
      UpdateExpression: "SET isDeleted = :isDeleted, updatedTimestamp = :updatedTimestamp",
      ExpressionAttributeValues: {
        ":isDeleted": true,
        ":updatedTimestamp": new Date().toISOString(),
      },
    }),
  );
};

export const deleteUrl: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  const shortUrlId = event.pathParameters?.shortUrlId;
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  const userOwnsUrl = await checkUserOwnsUrl(userId, shortUrlId);
  if (!userOwnsUrl) throw new Forbidden("You do not own this URL");

  console.log(`Deleting URL ${shortUrlId} owned by ${userId}`);

  await softDeleteUrlItem(shortUrlId);

  return response({ statusCode: 204 });
};
