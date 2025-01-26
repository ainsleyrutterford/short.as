import { GetParameterCommand } from "@aws-sdk/client-ssm";

import { isProd } from "../utils";
import { ssmClient } from "../clients/ssm";
import { OAuthProvider } from "./types";

// TODO: LLRT doesn't support URL safe encoding until this is released: https://github.com/awslabs/llrt/pull/777
export const replaceUrlSafeEncoding = (s: string) => s.replace(/_/g, "/").replace(/-/g, "+");

export const nowInSeconds = () => Math.floor(Date.now() / 1000);

const cachedOAuthClientInformation: Partial<Record<OAuthProvider, { client_id: string; client_secret: string }>> = {};

/**
 * Fetches the client ID and secret from AWS SSM Parameter Store. We use `SecureString` Parameter store
 * values instead of AWS Secrets Manager secrets because they are free whereas secrets cost $0.40 per
 * secret per month.
 *
 * The Parameters were manually created and they have a JSON string containing the client ID and secret.
 *
 * The OAuth client information for the provider is cached in a global variable after it is first fetched
 * so that other invocations of this Lambda have a chance to use the cached information rather than re-fetching it.
 */
export const fetchOAuthClientInformation = async (
  provider: OAuthProvider,
): Promise<{ client_id: string; client_secret: string }> => {
  if (cachedOAuthClientInformation[provider]) {
    console.log(`Found cached OAuth client information for ${provider}`);
    return cachedOAuthClientInformation[provider];
  }

  console.log(`No cached OAuth client information found for ${provider}, fetching it instead...`);
  const parameterName = `/${isProd ? "prod" : "dev"}/oauth/${provider}`;
  const response = await ssmClient.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
  if (!response.Parameter?.Value) {
    throw new Error(`No value found for parameter: ${parameterName}`);
  }

  const { client_id, client_secret } = JSON.parse(response.Parameter.Value);
  if (!client_id || !client_secret) {
    throw new Error(`Client ID or client secret not found for parameter: ${parameterName}`);
  }

  cachedOAuthClientInformation[provider] = { client_id, client_secret };
  return cachedOAuthClientInformation[provider];
};
