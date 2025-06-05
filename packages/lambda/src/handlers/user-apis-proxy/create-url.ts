import { BadRequest, InternalServerError } from "../../errors";
import { AuthenticatedHandler } from "../../oauth/types";
import { parseBody, response } from "../../utils";
import { createShortUrl } from "../create-short-url";

interface Body {
  longUrl?: string;
}

export const createUrlForUser: AuthenticatedHandler = async (event) => {
  const userId = event.auth?.userId;
  if (!userId) throw new InternalServerError();

  console.log(`Creating URL for user with ID: ${userId}`);

  const { longUrl } = parseBody(event) as Body;
  if (!longUrl) throw new BadRequest("A longUrl must be provided in the request body");

  const shortUrlId = await createShortUrl(longUrl, userId);
  return response({ statusCode: 200, body: JSON.stringify({ shortUrlId }) });
};
