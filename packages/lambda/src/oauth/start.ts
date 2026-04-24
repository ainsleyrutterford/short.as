/**
 * OAuth login endpoint — generates the authorization URL and redirects the user to the provider.
 * See https://thecopenhagenbook.com/oauth for the reference implementation pattern:
 * - A new `state` is generated per request and stored in an httpOnly cookie for CSRF protection.
 * - For PKCE providers (Google, Microsoft), a `codeVerifier` is also generated and stored in a cookie.
 * - GitHub uses a client secret without PKCE, which is equally secure for confidential clients.
 */
import * as arctic from "arctic";
import * as cookie from "cookie";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { OAuthProvider } from "@short-as/types";

import { response, siteUrl } from "../utils";
import { fetchOAuthClientInformation } from "./utils";
import { oAuthFlowCookieOptions } from "./cookies";

const PKCE_PROVIDERS = new Set([OAuthProvider.Google, OAuthProvider.Microsoft]);

const SCOPES: Record<OAuthProvider, string[]> = {
  [OAuthProvider.Google]: ["openid", "profile", "email"],
  [OAuthProvider.GitHub]: ["user:email"],
  [OAuthProvider.Microsoft]: ["openid", "profile", "email"],
};

const createProviderClient = async (provider: OAuthProvider) => {
  const { client_id, client_secret } = await fetchOAuthClientInformation(provider);
  const redirectUri = `${siteUrl}/api/oauth/${provider}`;

  switch (provider) {
    case OAuthProvider.Google:
      return new arctic.Google(client_id, client_secret, redirectUri);
    case OAuthProvider.GitHub:
      return new arctic.GitHub(client_id, client_secret, redirectUri);
    case OAuthProvider.Microsoft:
      return new arctic.MicrosoftEntraId("common", client_id, client_secret, redirectUri);
  }
};

const createAuthorizationUrl = (
  client: arctic.Google | arctic.GitHub | arctic.MicrosoftEntraId,
  provider: OAuthProvider,
  state: string,
  cookies: string[],
): URL => {
  if (PKCE_PROVIDERS.has(provider)) {
    const codeVerifier = arctic.generateCodeVerifier();
    cookies.push(cookie.serialize("oauth_code_verifier", codeVerifier, oAuthFlowCookieOptions));
    const url = (client as arctic.Google | arctic.MicrosoftEntraId).createAuthorizationURL(
      state,
      codeVerifier,
      SCOPES[provider],
    );
    // Entra ID requires a nonce for OIDC but it isn't useful for server-based OAuth
    // See https://arcticjs.dev/providers/microsoft-entra-id
    if (provider === OAuthProvider.Microsoft) {
      url.searchParams.set("nonce", "_");
    }
    return url;
  }
  return (client as arctic.GitHub).createAuthorizationURL(state, SCOPES[provider]);
};

export const handleOAuthStart = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  const provider = event.queryStringParameters?.provider as OAuthProvider | undefined;
  if (!provider || !Object.values(OAuthProvider).includes(provider)) {
    return response({ statusCode: 400, body: JSON.stringify({ message: "Invalid or missing provider" }) });
  }

  const client = await createProviderClient(provider);
  const state = arctic.generateState();
  const cookies: string[] = [cookie.serialize("oauth_state", state, oAuthFlowCookieOptions)];
  const authorizationUrl = createAuthorizationUrl(client, provider, state, cookies);

  return response({
    statusCode: 302,
    cookies,
    headers: { Location: authorizationUrl.toString() },
  });
};
