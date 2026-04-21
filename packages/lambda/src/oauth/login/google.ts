import * as arctic from "arctic";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { siteUrl } from "../../utils";

/**
 * Google's OIDC ID token claims.
 * See https://developers.google.com/identity/openid-connect/openid-connect#an-id-tokens-payload
 */
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

  private async createGoogleClient(): Promise<arctic.Google> {
    const { client_id, client_secret } = await fetchOAuthClientInformation(this.oAuthProvider);
    return new arctic.Google(client_id, client_secret, `${siteUrl}/api/oauth/google`);
  }

  async fetchUserData(code: string, codeVerifier?: string): Promise<UserDdbInput> {
    if (!codeVerifier) throw new Error("Missing code verifier for Google PKCE flow");
    const google = await this.createGoogleClient();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const googleUser = arctic.decodeIdToken(tokens.idToken()) as GoogleUser;

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
