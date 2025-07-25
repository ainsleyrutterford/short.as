import { BadRequest, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { response } from "../../utils";

export const getUrlDetails: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  const shortUrlId = event.pathParameters?.shortUrlId;
  if (!shortUrlId) throw new BadRequest("A shortUrlId must be provided in the request path parameters");

  console.log(`Getting details about URL ${shortUrlId} owned by ${userId}`);

  return response({ statusCode: 200, body: JSON.stringify(shortUrlId) });
};
