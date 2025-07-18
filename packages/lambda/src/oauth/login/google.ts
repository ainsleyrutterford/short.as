import { URLSearchParams } from "url";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { decodeJwtPayload } from "../jwt";
import { siteUrl } from "../../utils";

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

export class GoogleLoginHandler extends OAuthLoginHandler {
  oAuthProvider = OAuthProvider.Google;

  async fetchGoogleOAuthTokens(code: string): Promise<GoogleOAuthResponse> {
    const baseUrl = "https://oauth2.googleapis.com/token";

    const { client_id, client_secret } = await fetchOAuthClientInformation(this.oAuthProvider);

    const queryStrings = new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: `${siteUrl}/api/oauth/google`,
      grant_type: "authorization_code",
    });

    const response = await fetch(`${baseUrl}?${queryStrings.toString()}`, {
      method: "POST",
      // Content-Length wasn't needed initially, but after a few months we suddenly needed it to
      // avoid a 411 error... https://stackoverflow.com/a/18352423
      // We should probably start using the official Google APIs npm package once LLRT supports
      // the necessary Node modules.
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": "0" },
    });

    return response.json();
  }

  async fetchUserData(code: string): Promise<UserDdbInput> {
    const { id_token } = await this.fetchGoogleOAuthTokens(code);
    const googleUser = decodeJwtPayload<GoogleUser>(id_token);

    return {
      // We can't just use the sub as it isn't guaranteed to be unique for other providers too
      id: `${this.oAuthProvider}-${googleUser.sub}`,
      oAuthProvider: this.oAuthProvider,
      email: googleUser.email,
      name: googleUser.name,
      profilePictureUrl: googleUser.picture,
    };
  }
}
