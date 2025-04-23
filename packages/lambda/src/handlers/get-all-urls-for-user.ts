import { dynamoClient } from "../clients/dynamo";
import { getStringEnvironmentVariable, response, warmingWrapper } from "../utils";
import { AuthenticatedCallback, authWrapper } from "../oauth/auth-wrapper";
import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { Url } from "@short-as/types";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");
const USER_ID_GSI_NAME = getStringEnvironmentVariable("USER_ID_GSI_NAME");

interface PathParameters {
  userId?: string;
}

const getAllUrlsForUser: AuthenticatedCallback = async ({ event, userId }) => {
  console.log("Handling getAllUrlsForUser request...");

  const { userId: pathParameterUserId } = event.pathParameters as PathParameters;

  if (!pathParameterUserId) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "A userId must be provided in the request path parameters" }),
    });
  }

  if (userId !== pathParameterUserId) {
    return response({
      statusCode: 403,
      body: JSON.stringify({ message: "You cannot call this API for someone else's userId" }),
    });
  }

  console.log(`Getting URLs for user with ID: ${userId}`);

  const paginator = paginateQuery(
    { client: dynamoClient },
    {
      TableName: URLS_TABLE_NAME,
      IndexName: USER_ID_GSI_NAME,
      KeyConditionExpression: "owningUserId = :owningUserId",
      ExpressionAttributeValues: { ":owningUserId": userId },
    },
  );

  const urls: Url[] = [];
  for await (const { Items } of paginator) {
    urls.push(...((Items ?? []) as Url[]));
  }

  return response({ statusCode: 200, body: JSON.stringify(urls) });
};

export const getAllUrlsForUserHandler = warmingWrapper(async (event) => authWrapper(event, getAllUrlsForUser));
