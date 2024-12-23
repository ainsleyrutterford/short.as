import { URLSearchParams } from "url";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import * as cookie from "cookie";

import { response } from "../../../utils";
import {
  ACCESS_TOKEN_TTL,
  createSignedJwt,
  decodeJwtPayload,
  fetchJwtSigningKey,
  fetchOAuthClientInformation,
  nowInSeconds,
  OAuthProvider,
  REFRESH_TOKEN_TTL,
  secureCookieOptions,
  secureJavaScriptCookieOptions,
} from "../utils";
import { putUser } from "../user";

interface GoogleOAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  id_token: string;
}

interface GoogleUser {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

const fetchGoogleOAuthTokens = async (code: string): Promise<GoogleOAuthResponse> => {
  console.log("Fetching Google OAuth tokens...");

  const baseUrl = "https://oauth2.googleapis.com/token";

  const { client_id, client_secret } = await fetchOAuthClientInformation(OAuthProvider.Google);

  const queryStrings = new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri: "https://dev.short.as/api/oauth/google",
    grant_type: "authorization_code",
  });

  const response = await fetch(`${baseUrl}?${queryStrings.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  console.log("Google OAuth tokens fetched");

  return response.json();
};

export const handleGoogleOAuthRequest = async (event: APIGatewayProxyEventV2) => {
  console.log("Handling Google OAuth request...");

  const code = event.queryStringParameters?.code;

  if (!code) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "Missing code query string parameter" }),
    });
  }

  const { id_token } = await fetchGoogleOAuthTokens(code);

  const user = decodeJwtPayload<GoogleUser>(id_token);

  if (!user.email_verified) {
    return response({
      statusCode: 401,
      body: JSON.stringify({ message: "The email for this account is not verified" }),
    });
  }

  const now = nowInSeconds();

  const jwtSigningKey = await fetchJwtSigningKey();

  const accessToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: REFRESH_TOKEN_TTL });

  await putUser({
    // We can't just use the sub as it isn't guaranteed to be unique for other providers too
    id: `${OAuthProvider.Google}-${user.sub}`,
    oAuthProvider: OAuthProvider.Google,
    email: user.email,
    name: user.name,
    profilePictureUrl: user.picture,
    lastOAuthLoginTime: now,
    lastRefreshLoginTime: now,
  });

  const accessTokenCookie = cookie.serialize("accessToken", accessToken, secureCookieOptions);
  const refreshTokenCookie = cookie.serialize("refreshToken", refreshToken, secureCookieOptions);

  // This cookie can be used by the frontend to quickly check if it is logged in
  const loggedInCookie = cookie.serialize("loggedIn", "true", secureJavaScriptCookieOptions);

  return response({
    statusCode: 301,
    cookies: [accessTokenCookie, refreshTokenCookie, loggedInCookie],
    headers: { Location: "https://dev.short.as/create" },
  });
};
