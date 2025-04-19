import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as cookie from "cookie";

import { response } from "../utils";
import { AccessToken, RefreshToken } from "./types";
import { getUser } from "./user";
import { nowInSeconds } from "./utils";
import { decodeJwtPayload, isValidJwt } from "./jwt";
import { createLoggedInCookies } from "./cookies";
import { User } from "@short-as/types";

export type AuthenticatedCallback = ({
  event,
  userId,
  user,
  returnCookies,
}: {
  event: APIGatewayProxyEventV2;
  userId: string;
  user?: User;
  returnCookies?: string[];
}) => Promise<APIGatewayProxyStructuredResultV2>;

/**
 * Checks if the access token or refresh token are valid, and calls the callback if they are.
 * If a user is fetched to check the refreshToken, then that user is passed through to the
 * callback too for convenience.
 */
export const authWrapper = async (
  event: APIGatewayProxyEventV2,
  callback: AuthenticatedCallback,
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("Checking auth JWTs...");

  const cookies = event.cookies?.map((c) => cookie.parse(c));

  const accessToken = cookies?.find((c) => c.accessToken)?.accessToken;
  const refreshToken = cookies?.find((c) => c.refreshToken)?.refreshToken;

  if (!accessToken || !refreshToken) {
    return response({ statusCode: 403, body: "accessToken and refreshToken cookies required" });
  }

  const now = nowInSeconds();

  if (await isValidJwt(accessToken)) {
    console.log("Valid access token found, calling callback...");
    const accessTokenContents = decodeJwtPayload<AccessToken>(accessToken);
    return callback({ event, userId: accessTokenContents.userId });
  }

  if (!(await isValidJwt(refreshToken))) {
    return response({ statusCode: 403, body: "refreshToken is invalid" });
  }

  const refreshTokenContents = decodeJwtPayload<RefreshToken>(refreshToken);

  const user = await getUser(refreshTokenContents.userId);

  if (refreshTokenContents.version !== user.refreshTokenVersion) {
    return response({ statusCode: 403, body: "User has logged out of all devices" });
  }

  // Generate new access and refresh tokens
  const returnCookies = await createLoggedInCookies({
    now,
    userId: refreshTokenContents.userId,
    oAuthProvider: refreshTokenContents.oAuthProvider,
    refreshTokenVersion: refreshTokenContents.version,
  });

  console.log("Valid refresh token found, calling callback...");
  return callback({ event, userId: refreshTokenContents.userId, user, returnCookies });
};
