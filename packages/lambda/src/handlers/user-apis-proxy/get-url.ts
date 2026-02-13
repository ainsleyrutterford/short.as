import { BadRequest, Forbidden, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { response } from "../../utils";
import { checkUserOwnsUrl } from "./get-url-views";

export const getUrlDetails: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  const shortUrlId = event.pathParameters?.shortUrlId;
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  const { userOwnsUrl, urlItem } = await checkUserOwnsUrl(userId, shortUrlId);
  if (!userOwnsUrl) throw new Forbidden("You do not own this URL");

  console.log(`Getting details about URL ${shortUrlId} owned by ${userId}`);

  return response({ statusCode: 200, body: JSON.stringify(urlItem) });
};
