import { URLSearchParams } from "url";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import * as cookie from "cookie";

import { response } from "../../../utils";
import {
  ACCESS_TOKEN_TTL,
  createSignedJwt,
  fetchJwtSigningKey,
  fetchOAuthClientInformation,
  nowInSeconds,
  OAuthProvider,
  REFRESH_TOKEN_TTL,
  secureCookieOptions,
  secureJavaScriptCookieOptions,
} from "../utils";
import { putUser } from "../user";

interface FacebookOAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

const FACEBOOK_BASE_URL = "https://graph.facebook.com/v21.0";

const handleFacebookOAuth = async (code: string): Promise<FacebookOAuthResponse> => {
  const baseUrl = `${FACEBOOK_BASE_URL}/oauth/access_token`;

  const { client_id, client_secret } = await fetchOAuthClientInformation(OAuthProvider.Facebook);

  const queryStrings = new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri: "https://dev.short.as/api/oauth/facebook",
  });

  const response = await fetch(`${baseUrl}?${queryStrings.toString()}`);

  return response.json();
};

const getFacebookUserData = async (access_token: string): Promise<FacebookUser> => {
  // https://developers.facebook.com/docs/graph-api/overview/#me
  const baseUrl = `${FACEBOOK_BASE_URL}/me`;
  const queryStrings = new URLSearchParams({
    fields: "id,name,email,picture",
    access_token,
  });

  const response = await fetch(`${baseUrl}?${queryStrings.toString()}`);
  const user = await response.json();

  const pictureUrl = `${baseUrl}/picture`;
  const pictureQueryStrings = new URLSearchParams({
    type: "large",
    access_token,
  });

  const pictureResponse = await fetch(`${pictureUrl}?${pictureQueryStrings.toString()}`);

  return { ...user, picture: pictureResponse.url };
};

export const handleFacebookOAuthRequest = async (event: APIGatewayProxyEventV2) => {
  console.log("Handling Facebook OAuth request...");

  const code = event.queryStringParameters?.code;

  if (!code) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "Missing code query string parameter" }),
    });
  }

  const { access_token } = await handleFacebookOAuth(code);

  console.log(access_token);

  const user = await getFacebookUserData(access_token);

  console.log(user);

  const now = nowInSeconds();

  const jwtSigningKey = await fetchJwtSigningKey();

  const accessToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: REFRESH_TOKEN_TTL });

  await putUser({
    id: `${OAuthProvider.Facebook}-${user.id}`,
    oAuthProvider: OAuthProvider.Facebook,
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
