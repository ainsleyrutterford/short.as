import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { KJUR } from "jsrsasign";

import { nowInSeconds, replaceUrlSafeEncoding } from "./utils";
import { ssmClient } from "../clients/ssm";
import { isProd } from "../utils";

export const ACCESS_TOKEN_TTL = 600; // 10 mins
export const REFRESH_TOKEN_TTL = 5184000; // 60 days

const JWT_SIGNING_ALG = "HS256";

export const decodeJwtHeader = <T = Record<string, unknown>>(token: string): T =>
  JSON.parse(Buffer.from(replaceUrlSafeEncoding(token.split(".")[0]), "base64").toString());

export const decodeJwtPayload = <T = Record<string, unknown>>(token: string): T =>
  JSON.parse(Buffer.from(replaceUrlSafeEncoding(token.split(".")[1]), "base64").toString());

let cachedJwtSigningKey: string | undefined = undefined;

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
 *
 * The key is cached in a global variable after it is first fetched so that other invocations
 * of this Lambda have a chance to use the cached key rather than re-fetching it.
 */
export const fetchJwtSigningKey = async (): Promise<string> => {
  if (cachedJwtSigningKey) return cachedJwtSigningKey;

  console.log("No cached JWT signing key found, fetching one instead...");
  const parameterName = `/${isProd ? "prod" : "dev"}/oauth/jwt-signing-key`;
  const response = await ssmClient.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
  if (!response.Parameter?.Value) {
    throw new Error(`No value found for parameter: ${parameterName}`);
  }

  cachedJwtSigningKey = response.Parameter?.Value;
  return cachedJwtSigningKey;
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
export const createSignedJwt = async ({
  payload,
  now,
  expiresIn,
}: {
  payload: Record<string, unknown>;
  now: number;
  expiresIn: number;
}) => {
  const jwtSigningKey = await fetchJwtSigningKey();

  return KJUR.jws.JWS.sign(
    JWT_SIGNING_ALG,
    JSON.stringify({ alg: JWT_SIGNING_ALG, typ: "JWT" }),
    JSON.stringify({ ...payload, iat: now, exp: now + expiresIn }),
    jwtSigningKey,
  );
};

/**
 * https://github.com/kjur/jsrsasign/wiki/Tutorial-for-JWT-verification
 */
export const isValidJwt = async (jwt: string) => {
  const jwtSigningKey = await fetchJwtSigningKey();

  return KJUR.jws.JWS.verifyJWT(jwt, jwtSigningKey, { alg: [JWT_SIGNING_ALG], verifyAt: nowInSeconds() });
};
