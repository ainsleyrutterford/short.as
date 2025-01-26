import { APIGatewayProxyEventV2 } from "aws-lambda";

import { response } from "../utils";
import { getUser } from "./user";
import { AuthenticatedCallback, authWrapper } from "./auth-wrapper";

const me: AuthenticatedCallback = async ({ user, userId, returnCookies }) => {
  console.log("Handling me request...");

  if (user) {
    console.log("User already fetched.");
    return response({ statusCode: 200, body: JSON.stringify(user), cookies: returnCookies });
  }

  console.log("Fetching user...");
  const fetchedUser = await getUser(userId);
  return response({ statusCode: 200, body: JSON.stringify(fetchedUser), cookies: returnCookies });
};

export const handleMeRequest = async (event: APIGatewayProxyEventV2) => authWrapper(event, me);
