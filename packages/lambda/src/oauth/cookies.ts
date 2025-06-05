import * as cookie from "cookie";
import { OAuthProvider } from "@short-as/types";

import { AccessToken, RefreshToken } from "./types";
import { ACCESS_TOKEN_TTL, createSignedJwt, REFRESH_TOKEN_TTL } from "./jwt";

// Set this to true when testing with localhost
export const TESTING_LOCALHOST = false;

export const secureCookieOptions: cookie.SerializeOptions = {
  // Client side JavaScript cannot access the cookie
  httpOnly: true,
  // Client only sends cookies if it is an HTTPS connection
  secure: true,
  sameSite: TESTING_LOCALHOST ? "none" : "strict",
  domain: TESTING_LOCALHOST ? undefined : "short.as",
  path: "/",
  maxAge: REFRESH_TOKEN_TTL,
};

export const secureJavaScriptCookieOptions: cookie.SerializeOptions = {
  ...secureCookieOptions,
  httpOnly: false,
};

export const createLoggedInCookies = async ({
  now,
  userId,
  oAuthProvider,
  refreshTokenVersion,
}: {
  now: number;
  userId: string;
  oAuthProvider: OAuthProvider;
  refreshTokenVersion: number;
}) => {
  const accessTokenContents: AccessToken = { userId, oAuthProvider };
  const refreshTokenContents: RefreshToken = { ...accessTokenContents, version: refreshTokenVersion };

  const accessToken = await createSignedJwt({
    payload: { ...accessTokenContents },
    now,
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = await createSignedJwt({
    payload: { ...refreshTokenContents },
    now,
    expiresIn: REFRESH_TOKEN_TTL,
  });

  return [
    cookie.serialize("accessToken", accessToken, secureCookieOptions),
    cookie.serialize("refreshToken", refreshToken, secureCookieOptions),
    // This can be used by the frontend to check logged in state since it doesn't have `httpOnly` set
    cookie.serialize("loggedIn", "true", secureJavaScriptCookieOptions),
  ];
};

export const loggedOutCookies = [
  cookie.serialize("accessToken", "", secureCookieOptions),
  cookie.serialize("refreshToken", "", secureCookieOptions),
  // This can be used by the frontend to check logged in state since it doesn't have `httpOnly` set
  cookie.serialize("loggedIn", "false", secureJavaScriptCookieOptions),
];
