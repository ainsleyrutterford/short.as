import { paginateQuery } from "@aws-sdk/lib-dynamodb";
import { Url } from "@short-as/types";

import { UserApiCallback } from "./types";
import { dynamoClient } from "../../clients/dynamo";
import { getStringEnvironmentVariable } from "../../utils";

const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");
const USER_ID_GSI_NAME = getStringEnvironmentVariable("USER_ID_GSI_NAME");

export const listUrlsForUser: UserApiCallback = async ({ userId, responseWithCookies }) => {
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

  return responseWithCookies({ statusCode: 200, body: JSON.stringify(urls) });
};
