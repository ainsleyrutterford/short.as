import * as arctic from "arctic";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { siteUrl } from "../../utils";
import { OAuthError } from "../../errors";

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

/**
 * https://docs.github.com/en/rest/users/emails?apiVersion=2022-11-28#list-email-addresses-for-the-authenticated-user
 */
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export class GitHubLoginHandler extends OAuthLoginHandler {
  oAuthProvider = OAuthProvider.GitHub;

  private async createGitHubClient(): Promise<arctic.GitHub> {
    const { client_id, client_secret } = await fetchOAuthClientInformation(this.oAuthProvider);
    return new arctic.GitHub(client_id, client_secret, `${siteUrl}/api/oauth/github`);
  }

  private gitHubHeaders(accessToken: string) {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  async fetchGitHubUserData(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", { headers: this.gitHubHeaders(accessToken) });
    return response.json();
  }

  private async fetchVerifiedPrimaryEmail(accessToken: string) {
    const response = await fetch("https://api.github.com/user/emails", { headers: this.gitHubHeaders(accessToken) });
    const emails: GitHubEmail[] = await response.json();
    const primary = emails.find((e) => e.primary && e.verified);
    if (!primary) throw new OAuthError("email_not_verified");
    return primary.email;
  }

  async fetchUserData(code: string, _codeVerifier?: string): Promise<UserDdbInput> {
    const github = await this.createGitHubClient();
    const tokens = await github.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();
    const [githubUser, email] = await Promise.all([
      this.fetchGitHubUserData(accessToken),
      this.fetchVerifiedPrimaryEmail(accessToken),
    ]);

    return {
      id: `${this.oAuthProvider}-${githubUser.id}`,
      oAuthProvider: this.oAuthProvider,
      email,
      name: githubUser.name,
      profilePictureUrl: githubUser.avatar_url,
    };
  }
}
