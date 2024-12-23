import { GetParameterCommand } from "@aws-sdk/client-ssm";
import * as cookie from "cookie";
import { KJUR } from "jsrsasign";

import { ssmClient } from "../../clients";
import { isProd } from "../../utils";

export enum OAuthProvider {
  Google = "google",
  GitHub = "github",
  Facebook = "facebook",
}

const JWT_SIGNING_ALG = "HS256";

export const ACCESS_TOKEN_TTL = 600; // 10 mins
export const REFRESH_TOKEN_TTL = 5184000; // 60 days

export const secureCookieOptions: cookie.SerializeOptions = {
  // Client side JavaScript cannot access the cookie
  httpOnly: true,
  // Client only sends cookies if it is an HTTPS connection
  secure: isProd,
  sameSite: "strict",
  domain: isProd ? "short.as" : undefined,
  path: "/",
  // 1 month in seconds
  maxAge: 60 * 60 * 24 * 30,
};

export const secureJavaScriptCookieOptions: cookie.SerializeOptions = {
  ...secureCookieOptions,
  httpOnly: false,
};

export const decodeJwtHeader = <T = Record<string, unknown>>(token): T =>
  JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());

export const decodeJwtPayload = <T = Record<string, unknown>>(token): T =>
  JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());

export const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * Generated signing keys manually using:
 *
 * ```
 * node -e "console.log(require('crypto').randomBytes(64).toString('base64'));"
 * ```
 *
 * Then manually created dev and prod SSM Parameters to store the keys.
 *
 * It needs to be at least 32 bytes long to avoid brute forcing:
 * https://auth0.com/blog/brute-forcing-hs256-is-possible-the-importance-of-using-strong-keys-to-sign-jwts/
 */
export const fetchJwtSigningKey = async (): Promise<string> => {
  const parameterName = `/${isProd ? "prod" : "dev"}/oauth/jwt-signing-key`;

  const response = await ssmClient.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));

  if (!response.Parameter?.Value) {
    throw new Error(`No value found for parameter: ${parameterName}`);
  }

  return response.Parameter?.Value;
};

/**
 * We can't use `jsonwebtoken` or `jose` because LLRT doesn't support SubtleCrypto yet,
 * see: https://github.com/awslabs/llrt/issues/184.
 *
 * For now, we use a pure JS implementation, see:
 * - https://github.com/kjur/jsrsasign/wiki/Tutorial-for-JWT-generation
 *
 * @param payload a serializable object
 * @param expiresIn seconds until the token expires
 * @returns jwt string
 */
export const createSignedJwt = ({
  jwtSigningKey,
  payload,
  now,
  expiresIn,
}: {
  jwtSigningKey: string;
  payload: Record<string, unknown>;
  now: number;
  expiresIn: number;
}): string =>
  KJUR.jws.JWS.sign(
    JWT_SIGNING_ALG,
    JSON.stringify({ alg: JWT_SIGNING_ALG, typ: "JWT" }),
    JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }),
    jwtSigningKey,
  );

/**
 * https://github.com/kjur/jsrsasign/wiki/Tutorial-for-JWT-verification
 */
export const isValidJwt = (jwtSigningKey: string, jwt: string) =>
  KJUR.jws.JWS.verifyJWT(jwt, jwtSigningKey, { alg: [JWT_SIGNING_ALG] });

/**
 * Fetches the client ID and secret from AWS SSM Parameter Store. We use `SecureString` Parameter store
 * values instead of AWS Secrets Manager secrets because they are free whereas secrets cost $0.40 per
 * secret per month.
 *
 * The Parameters were manually created and they have a JSON string containing the client ID and secret.
 */
export const fetchOAuthClientInformation = async (
  provider: OAuthProvider,
): Promise<{ client_id: string; client_secret: string }> => {
  const parameterName = `/${isProd ? "prod" : "dev"}/oauth/${provider}`;

  const response = await ssmClient.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));

  if (!response.Parameter?.Value) {
    throw new Error(`No value found for parameter: ${parameterName}`);
  }

  const { client_id, client_secret } = JSON.parse(response.Parameter.Value);

  if (!client_id || !client_secret) {
    throw new Error(`Client ID or client secret not found for parameter: ${parameterName}`);
  }

  return { client_id, client_secret };
};
