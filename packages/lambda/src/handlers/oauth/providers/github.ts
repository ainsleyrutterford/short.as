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

interface GitHubOAuthResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: string;
  scope: string;
  token_type: string;
}

/**
 * A subset of:
 * https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user
 */
interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  url: string;
  html_url: string;
  name: string;
  location: string;
  email: string;
  bio: string;
}

const handleGitHubOAuth = async (code: string): Promise<GitHubOAuthResponse> => {
  const baseUrl = "https://github.com/login/oauth/access_token";

  const { client_id, client_secret } = await fetchOAuthClientInformation(OAuthProvider.GitHub);

  const params = new URLSearchParams({
    code,
    client_id,
    client_secret,
  });

  // https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#generating-a-user-access-token-when-a-user-installs-your-app
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const text = await response.text();
  // Parse form-encoded response
  const parsed = new URLSearchParams(text);
  const data = Object.fromEntries(parsed.entries());

  return data as unknown as GitHubOAuthResponse;
};

const getGitHubUserData = async (access_token: string): Promise<GitHubUser> => {
  const url = "https://api.github.com/user";

  const options = {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json", // GitHub API response format
      Authorization: `Bearer ${access_token}`,
      "X-GitHub-Api-Version": "2022-11-28", // Specific GitHub API version
    },
  };

  const response = await fetch(url, options);
  return response.json();
};

export const handleGitHubOAuthRequest = async (event: APIGatewayProxyEventV2) => {
  console.log("Handling GitHub OAuth request...");

  const code = event.queryStringParameters?.code;

  if (!code) {
    return response({
      statusCode: 400,
      body: JSON.stringify({ message: "Missing code query string parameter" }),
    });
  }

  const { access_token } = await handleGitHubOAuth(code);

  const user = await getGitHubUserData(access_token);

  const now = nowInSeconds();

  const jwtSigningKey = await fetchJwtSigningKey();

  const accessToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = createSignedJwt({ jwtSigningKey, payload: { ...user }, now, expiresIn: REFRESH_TOKEN_TTL });

  await putUser({
    id: `${OAuthProvider.GitHub}-${user.id}`,
    oAuthProvider: OAuthProvider.GitHub,
    email: user.email,
    name: user.name,
    profilePictureUrl: user.avatar_url,
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
