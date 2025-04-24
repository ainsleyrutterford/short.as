import { APIGatewayProxyEventV2 } from "aws-lambda";
import * as cookie from "cookie";

import { loggedOutCookies } from "./cookies";
import { response } from "../utils";
import { decodeJwtPayload, isValidJwt } from "./jwt";
import { AccessToken, RefreshToken } from "./types";

export const handleLogoutRequest = async (event: APIGatewayProxyEventV2) => {
  console.log("Logging out a user...");

  const cookies = event.cookies?.map((c) => cookie.parse(c));
  const accessToken = cookies?.find((c) => c.accessToken)?.accessToken ?? "";
  const refreshToken = cookies?.find((c) => c.refreshToken)?.refreshToken ?? "";

  if (await isValidJwt(accessToken)) {
    console.log("Valid access token found...");
    const accessTokenContents = decodeJwtPayload<AccessToken>(accessToken);
    return response({
      statusCode: 200,
      body: `Successfully logged out ${accessTokenContents.userId}`,
      cookies: loggedOutCookies,
    });
  }

  if (await isValidJwt(refreshToken)) {
    console.log("Valid refresh token found...");
    const refreshTokenContents = decodeJwtPayload<RefreshToken>(refreshToken);
    return response({
      statusCode: 200,
      body: `Successfully logged out ${refreshTokenContents.userId}`,
      cookies: loggedOutCookies,
    });
  }

  console.log("No valid access or refresh tokens found, logging them out anyway ¯\\_(ツ)_/¯");

  return response({ statusCode: 200, body: "Successfully logged out", cookies: loggedOutCookies });
};
