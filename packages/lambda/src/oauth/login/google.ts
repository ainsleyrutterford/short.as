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
  async fetchGoogleOAuthTokens(code: string): Promise<GoogleOAuthResponse> {
    const baseUrl = "https://oauth2.googleapis.com/token";

    const { client_id, client_secret } = await fetchOAuthClientInformation(OAuthProvider.Google);

    const queryStrings = new URLSearchParams({
      code,
      client_id,
      client_secret,
      redirect_uri: `${siteUrl}/api/oauth/google`,
      grant_type: "authorization_code",
    });

    const response = await fetch(`${baseUrl}?${queryStrings.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.json();
  }

  async fetchUserData(now: number, code: string): Promise<UserDdbInput> {
    const { id_token } = await this.fetchGoogleOAuthTokens(code);
    const googleUser = decodeJwtPayload<GoogleUser>(id_token);

    return {
      // We can't just use the sub as it isn't guaranteed to be unique for other providers too
      id: `${OAuthProvider.Google}-${googleUser.sub}`,
      oAuthProvider: OAuthProvider.Google,
      email: googleUser.email,
      name: googleUser.name,
      profilePictureUrl: googleUser.picture,
      now,
    };
  }
}
