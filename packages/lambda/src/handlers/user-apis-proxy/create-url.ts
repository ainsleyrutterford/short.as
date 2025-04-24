import { UserApiCallback } from "./types";

export const createUrlForUser: UserApiCallback = async ({ userId, responseWithCookies }) => {
  console.log(`Creating URL for user with ID: ${userId}`);

  return responseWithCookies({ statusCode: 200, body: JSON.stringify({ hello: "Done!" }) });
};
