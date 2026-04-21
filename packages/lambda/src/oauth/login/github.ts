import * as arctic from "arctic";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { siteUrl } from "../../utils";

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
  oAuthProvider = OAuthProvider.GitHub;

  private async createGitHubClient(): Promise<arctic.GitHub> {
    const { client_id, client_secret } = await fetchOAuthClientInformation(this.oAuthProvider);
    return new arctic.GitHub(client_id, client_secret, `${siteUrl}/api/oauth/github`);
  }

  async fetchGitHubUserData(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return response.json();
  }

  async fetchUserData(code: string, _codeVerifier?: string): Promise<UserDdbInput> {
    const github = await this.createGitHubClient();
    const tokens = await github.validateAuthorizationCode(code);
    const githubUser = await this.fetchGitHubUserData(tokens.accessToken());

    return {
      id: `${this.oAuthProvider}-${githubUser.id}`,
      oAuthProvider: this.oAuthProvider,
      email: githubUser.email,
      name: githubUser.name,
      profilePictureUrl: githubUser.avatar_url,
    };
  }
}
