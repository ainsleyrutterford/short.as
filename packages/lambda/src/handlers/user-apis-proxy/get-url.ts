import { response } from "../../utils";
import { UserApiCallback } from "./types";

export const getUrlDetails: UserApiCallback = async ({ userId, shortUrlId, responseWithCookies }) => {
  console.log(`Getting details about URL ${shortUrlId} owned by ${userId}`);

  if (!shortUrlId) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "A shortUrlId must be provided in the request path parameters" }),
    });
  }

  return responseWithCookies({ statusCode: 200, body: JSON.stringify(shortUrlId) });
};
