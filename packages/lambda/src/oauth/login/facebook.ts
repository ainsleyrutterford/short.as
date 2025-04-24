import { URLSearchParams } from "url";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { siteUrl } from "../../utils";

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

export class FacebookLoginHandler extends OAuthLoginHandler {
  facebookOAuthBaseUrl = "https://graph.facebook.com/v21.0";

  async fetchFacebookOAuthTokens(code: string): Promise<FacebookOAuthResponse> {
    const baseUrl = `${this.facebookOAuthBaseUrl}/oauth/access_token`;

    const { client_id, client_secret } = await fetchOAuthClientInformation(OAuthProvider.Facebook);

    const queryStrings = new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: `${siteUrl}/api/oauth/facebook`,
    });

    const response = await fetch(`${baseUrl}?${queryStrings.toString()}`);

    return response.json();
  }

  async fetchFacebookUser(access_token: string): Promise<FacebookUser> {
    // https://developers.facebook.com/docs/graph-api/overview/#me
    const baseUrl = `${this.facebookOAuthBaseUrl}/me`;
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
  }

  async fetchUserData(code: string): Promise<UserDdbInput> {
    const { access_token } = await this.fetchFacebookOAuthTokens(code);
    const facebookUser = await this.fetchFacebookUser(access_token);

    return {
      id: `${OAuthProvider.Facebook}-${facebookUser.id}`,
      oAuthProvider: OAuthProvider.Facebook,
      email: facebookUser.email,
      name: facebookUser.name,
      profilePictureUrl: facebookUser.picture,
    };
  }
}
