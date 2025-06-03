import { BadRequest, HttpError } from "../../errors";
import { parseBody } from "../../utils";
import { createShortUrl } from "../create-short-url";
import { UserApiCallback } from "./types";

interface Body {
  longUrl?: string;
}

export const createUrlForUser: UserApiCallback = async ({ event, userId, responseWithCookies }) => {
  console.log(`Creating URL for user with ID: ${userId}`);

  try {
    const { longUrl } = parseBody(event) as Body;
    if (!longUrl) {
      throw new BadRequest("A longUrl must be provided in the request body");
    }

    const shortUrlId = await createShortUrl(longUrl, userId);
    return responseWithCookies({ statusCode: 200, body: JSON.stringify({ shortUrlId }) });
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(error);
      return responseWithCookies({ statusCode: error.statusCode, body: JSON.stringify({ message: error.message }) });
    }
    console.error(error);
    return responseWithCookies({
      statusCode: 500,
      body: JSON.stringify({ message: "An internal server error occurred" }),
    });
  }
};
