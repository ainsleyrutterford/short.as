import { APIGatewayProxyEventV2 } from "aws-lambda";

import { getUser } from "./user";
import { AuthenticatedCallback, authWrapper } from "./auth-wrapper";

const me: AuthenticatedCallback = async ({ user, userId, responseWithCookies }) => {
  console.log("Handling me request...");

  if (user) {
    console.log("User already fetched.");
    return responseWithCookies({ statusCode: 200, body: JSON.stringify(user) });
  }

  console.log("Fetching user...");
  const fetchedUser = await getUser(userId);
  return responseWithCookies({ statusCode: 200, body: JSON.stringify(fetchedUser) });
};

export const handleMeRequest = async (event: APIGatewayProxyEventV2) => authWrapper(event, me);
