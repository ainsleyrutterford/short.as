import * as arctic from "arctic";
import { OAuthProvider } from "@short-as/types";

import { fetchOAuthClientInformation } from "../utils";
import { UserDdbInput } from "../types";
import { OAuthLoginHandler } from "./login-handler";
import { siteUrl } from "../../utils";

/**
 * Microsoft Entra ID's OIDC ID token claims.
 * See https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference
 *
 * Note: Entra ID does not include a profile picture URL in the ID token. The profilePictureUrl
 * will be undefined for Microsoft users — the Avatar component shows initials as a fallback.
 */
interface MicrosoftUser {
  sub: string;
  name: string;
  email: string;
  oid: string;
  tid: string;
}

export class MicrosoftLoginHandler extends OAuthLoginHandler {
  oAuthProvider = OAuthProvider.Microsoft;

  private async createMicrosoftClient(): Promise<arctic.MicrosoftEntraId> {
    const { client_id, client_secret } = await fetchOAuthClientInformation(this.oAuthProvider);
    return new arctic.MicrosoftEntraId("common", client_id, client_secret, `${siteUrl}/api/oauth/microsoft`);
  }

  async fetchUserData(code: string, codeVerifier?: string): Promise<UserDdbInput> {
    if (!codeVerifier) throw new Error("Missing code verifier for Microsoft PKCE flow");
    const entraId = await this.createMicrosoftClient();
    const tokens = await entraId.validateAuthorizationCode(code, codeVerifier);
    const microsoftUser = arctic.decodeIdToken(tokens.idToken()) as MicrosoftUser;

    return {
      // We can't just use the sub as it isn't guaranteed to be unique for other providers too
      id: `${this.oAuthProvider}-${microsoftUser.sub}`,
      oAuthProvider: this.oAuthProvider,
      email: microsoftUser.email,
      name: microsoftUser.name,
    };
  }
}
