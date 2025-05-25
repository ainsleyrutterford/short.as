import { Middleware } from "./middy";

import * as cookie from "cookie";
import { decodeJwtPayload, isValidJwt } from "../oauth/jwt";
import { AccessToken, RefreshToken } from "../oauth/types";
import { getUser } from "../oauth/user";
import { createLoggedInCookies } from "../oauth/cookies";
import { nowInSeconds } from "../oauth/utils";
import { APIGatewayProxyEventV2WithAuth } from "../handlers/user-apis-proxy/types";

export const auth = (): Middleware<APIGatewayProxyEventV2WithAuth> => ({
  before: async (request) => {
    console.log("Checking auth JWTs...");

    const event = request.event;
    const cookies = event.cookies?.map((c) => cookie.parse(c)) ?? [];
    const accessToken = cookies.find((c) => c.accessToken)?.accessToken;
    const refreshToken = cookies.find((c) => c.refreshToken)?.refreshToken;

    if (!accessToken || !refreshToken) {
      return { statusCode: 403, body: "accessToken and refreshToken cookies required" };
    }

    if (await isValidJwt(accessToken)) {
      const accessTokenContents = decodeJwtPayload<AccessToken>(accessToken);
      event.auth = { userId: accessTokenContents.userId };
      console.log("Valid access token found, continuing to next middleware...");
      return;
    }

    if (!(await isValidJwt(refreshToken))) {
      return { statusCode: 403, body: "refreshToken is invalid" };
    }

    const refreshTokenContents = decodeJwtPayload<RefreshToken>(refreshToken);

    const user = await getUser(refreshTokenContents.userId);

    if (refreshTokenContents.version !== user.refreshTokenVersion) {
      return { statusCode: 403, body: "User has logged out of all devices" };
    }

    event.auth = { userId: refreshTokenContents.userId, user };

    // Generate new access and refresh tokens
    request.internal.cookiesToSet = await createLoggedInCookies({
      now: nowInSeconds(),
      userId: refreshTokenContents.userId,
      oAuthProvider: refreshTokenContents.oAuthProvider,
      refreshTokenVersion: refreshTokenContents.version,
    });

    console.log("Valid refresh token found, continuing to next middleware...");
  },

  after: async ({ response, internal }) => {
    const cookies = internal.cookiesToSet ?? [];
    if (cookies.length) response.cookies = [...(response.cookies ?? []), ...cookies];
  },
});
