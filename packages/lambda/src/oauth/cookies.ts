import * as cookie from "cookie";
import { OAuthProvider } from "@short-as/types";

import { AccessToken, RefreshToken } from "./types";
import { ACCESS_TOKEN_TTL, createSignedJwt, REFRESH_TOKEN_TTL } from "./jwt";
import { isProd } from "../utils";

/**
 * Set this to true when testing the frontend on localhost against the deployed dev backend.
 * It loosens session cookies to sameSite: "none" with no domain so they work cross-origin.
 * The localhost.test.ts test will fail if this is left true so we can't
 * accidentally deploy this to prod.
 *
 * NOTE: for Firefox, Enhanced Tracking Protection blocks cross-origin SameSite=None cookies by
 * default. Add https://localhost:3000 as an exception by clicking on the shield icon in the address
 * bar and toggling Enhanced Tracking Protection off for the site.
 */
export const TESTING_LOCALHOST = false;

export const secureCookieOptions: cookie.SerializeOptions = {
  httpOnly: true,
  secure: true,
  sameSite: TESTING_LOCALHOST ? "none" : "strict",
  domain: TESTING_LOCALHOST ? undefined : isProd ? "short.as" : "dev.short.as",
  path: "/",
  maxAge: REFRESH_TOKEN_TTL,
};

/**
 * Cookie options for the OAuth flow's temporary state and PKCE code verifier cookies.
 * See https://thecopenhagenbook.com/oauth for the recommended cookie attributes.
 *
 * These differ from the session cookies above because:
 * - `sameSite` is `"lax"` not `"strict"`. The provider redirects back to our callback as a
 *   cross-site navigation, and browsers don't send strict cookies in that case.
 * - `maxAge` is 10 minutes to limit the window of validity.
 *
 * These don't need the TESTING_LOCALHOST override because both the set (oauth/start) and
 * read (oauth/callback) happen on the same origin (short.as or dev.short.as) and localhost
 * is never involved.
 */
export const oAuthFlowCookieOptions: cookie.SerializeOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  domain: isProd ? "short.as" : "dev.short.as",
  path: "/",
  maxAge: 600,
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
