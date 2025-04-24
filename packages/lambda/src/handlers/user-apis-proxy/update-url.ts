import { parseBody, response } from "../../utils";
import { UserApiCallback } from "./types";

export const updateUrlDetails: UserApiCallback = async ({ event, userId, shortUrlId, responseWithCookies }) => {
  console.log(`Updating details about URL ${shortUrlId} owned by ${userId}`);

  if (!shortUrlId) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "A shortUrlId must be provided in the request path parameters" }),
    });
  }

  const body = parseBody(event);

  console.log(body);

  return responseWithCookies({ statusCode: 200, body: JSON.stringify(shortUrlId) });
};
