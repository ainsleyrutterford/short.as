import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import * as cookie from "cookie";

import { response } from "../utils";
import { AccessToken, RefreshToken } from "./types";
import { getUser } from "./user";
import { nowInSeconds } from "./utils";
import { decodeJwtPayload, isValidJwt } from "./jwt";
import { createLoggedInCookies } from "./cookies";
import { User } from "@short-as/types";

const responseWithCookies =
  (cookies: string[]) =>
  (value: APIGatewayProxyStructuredResultV2): APIGatewayProxyStructuredResultV2 =>
    response({ ...value, cookies });

export type AuthenticatedCallback = ({
  event,
  userId,
  user,
  responseWithCookies,
}: {
  event: APIGatewayProxyEventV2;
  userId: string;
  responseWithCookies: (value: APIGatewayProxyStructuredResultV2) => APIGatewayProxyStructuredResultV2;
  user?: User;
}) => Promise<APIGatewayProxyStructuredResultV2>;

/**
 * Checks if the access token or refresh token are valid, and calls the callback if they are.
 * If a user is fetched to check the refreshToken, then that user is passed through to the
 * callback too for convenience.
 *
 * A `responseWithCookies` function is passed through to the callback so that the callback can
 * return the correct cookies in the response.
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

  if (await isValidJwt(accessToken)) {
    console.log("Valid access token found, calling callback...");
    const accessTokenContents = decodeJwtPayload<AccessToken>(accessToken);
    return callback({
      event,
      userId: accessTokenContents.userId,
      // Since the original cookies are still valid, we can just not return any
      responseWithCookies: response,
    });
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
    now: nowInSeconds(),
    userId: refreshTokenContents.userId,
    oAuthProvider: refreshTokenContents.oAuthProvider,
    refreshTokenVersion: refreshTokenContents.version,
  });

  console.log("Valid refresh token found, calling callback...");
  return callback({
    event,
    userId: refreshTokenContents.userId,
    user,
    responseWithCookies: responseWithCookies(returnCookies),
  });
};
