import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";

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

export class GitHubLoginHandler extends OAuthLoginHandler {
  async fetchGitHubOAuthTokens(code: string): Promise<GitHubOAuthResponse> {
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
  }

  async fetchGitHubUserData(access_token: string): Promise<GitHubUser> {
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
  }

  async fetchUserData(code: string): Promise<UserDdbInput> {
    const { access_token } = await this.fetchGitHubOAuthTokens(code);
    const githubUser = await this.fetchGitHubUserData(access_token);

    return {
      id: `${OAuthProvider.GitHub}-${githubUser.id}`,
      oAuthProvider: OAuthProvider.GitHub,
      email: githubUser.email,
      name: githubUser.name,
      profilePictureUrl: githubUser.avatar_url,
    };
  }
}
