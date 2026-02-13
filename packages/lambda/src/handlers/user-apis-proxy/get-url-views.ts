import { Url, ViewAggregateItem } from "@short-as/types";
import { BadRequest, Forbidden, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { getStringEnvironmentVariable, response } from "../../utils";
import { dynamoClient } from "../../clients/dynamo";
import { GetCommand, paginateQuery } from "@aws-sdk/lib-dynamodb";

const AGGREGATION_TABLE_NAME = getStringEnvironmentVariable("AGGREGATION_TABLE_NAME");
const URLS_TABLE_NAME = getStringEnvironmentVariable("URLS_TABLE_NAME");

export const checkUserOwnsUrl = async (userId: string, shortUrlId: string) => {
  const urlItem = await dynamoClient.send(
    new GetCommand({
      TableName: URLS_TABLE_NAME,
      Key: { shortUrlId },
    }),
  );

  return {
    userOwnsUrl: urlItem?.Item?.owningUserId === userId && urlItem?.Item?.isDeleted !== true,
    urlItem: urlItem.Item as unknown as Url,
  };
};

const getViewAggregates = async (
  shortUrlId: string,
  startDate: string,
  endDate: string,
  interval: string,
): Promise<ViewAggregateItem[]> => {
  const paginator = paginateQuery(
    { client: dynamoClient },
    {
      TableName: AGGREGATION_TABLE_NAME,
      KeyConditionExpression: "pk = :pk and sk BETWEEN :startDate AND :endDate",
      ExpressionAttributeValues: {
        ":pk": `${interval}_${shortUrlId}`,
        ":startDate": startDate,
        ":endDate": endDate,
      },
    },
  );

  const viewAggregates: ViewAggregateItem[] = [];
  for await (const { Items } of paginator) {
    viewAggregates.push(...((Items ?? []) as ViewAggregateItem[]));
  }

  return viewAggregates;
};

export const getUrlViews: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  const shortUrlId = event.pathParameters?.shortUrlId;
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  const { userOwnsUrl } = await checkUserOwnsUrl(userId, shortUrlId);
  if (!userOwnsUrl) throw new Forbidden("You do not own this URL");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startDate = event.queryStringParameters?.startDate ?? sevenDaysAgo.toISOString();
  const endDate = event.queryStringParameters?.endDate ?? now.toISOString();
  const interval = event.queryStringParameters?.interval ?? "hour";

  console.log(
    `Getting views about URL ${shortUrlId} owned by ${userId}. Start date: ${startDate}, end date: ${endDate}`,
  );

  const viewAggregates = await getViewAggregates(shortUrlId, startDate, endDate, interval);

  return response({ statusCode: 200, body: JSON.stringify(viewAggregates) });
};
