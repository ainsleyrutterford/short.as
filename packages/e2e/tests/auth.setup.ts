// docs: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests
import { test as setup } from "@playwright/test";
import { KJUR } from "jsrsasign";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

const TEST_USER_ID = process.env.TEST_USER_ID || "e2e-test-user";
const STAGE = process.env.BASE_URL === "https://short.as" ? "prod" : "dev";
const USERS_TABLE = `Backend-${STAGE}-UsersTable`;

const AWS_REGION = "eu-west-2";

const fetchSigningKey = async () => {
  if (process.env.JWT_SIGNING_KEY) return process.env.JWT_SIGNING_KEY;

  const ssm = new SSMClient({ region: AWS_REGION });
  const response = await ssm.send(
    new GetParameterCommand({ Name: `/${STAGE}/oauth/jwt-signing-key`, WithDecryption: true }),
  );
  if (!response.Parameter?.Value) throw new Error("JWT signing key not found in SSM");
  return response.Parameter.Value;
};

const seedTestUser = async () => {
  const ddb = new DynamoDBClient({ region: AWS_REGION });
  await ddb.send(
    new PutItemCommand({
      TableName: USERS_TABLE,
      Item: {
        id: { S: TEST_USER_ID },
        oAuthProvider: { S: "google" },
        email: { S: "e2e@test.local" },
        name: { S: "E2E Test User" },
        profilePictureUrl: { S: "" },
        refreshTokenVersion: { N: "1" },
        oAuthLogins: { N: "1" },
        firstLoginTimestamp: { N: String(Math.floor(Date.now() / 1000)) },
        lastOAuthLoginTimestamp: { N: String(Math.floor(Date.now() / 1000)) },
        lastRefreshLoginTimestamp: { N: String(Math.floor(Date.now() / 1000)) },
      },
    }),
  );
};

setup("authenticate", async ({ page }) => {
  const signingKey = await fetchSigningKey();

  await seedTestUser();

  const now = Math.floor(Date.now() / 1000);
  const baseURL = process.env.BASE_URL || "https://dev.short.as";
  const domain = new URL(baseURL).hostname;

  const accessToken = KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({ userId: TEST_USER_ID, oAuthProvider: "google", iat: now, exp: now + 3600 }),
    signingKey,
  );
  const refreshToken = KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({ userId: TEST_USER_ID, oAuthProvider: "google", version: 1, iat: now, exp: now + 86400 }),
    signingKey,
  );

  // https://playwright.dev/docs/api/class-browsercontext#browser-context-add-cookies
  await page.context().addCookies([
    { name: "accessToken", value: accessToken, domain, path: "/" },
    { name: "refreshToken", value: refreshToken, domain, path: "/" },
  ]);

  // Set localStorage so the app knows we're logged in
  await page.goto(baseURL);
  await page.evaluate(() => window.localStorage.setItem("loggedIn", "true"));

  // https://playwright.dev/docs/api/class-browsercontext#browser-context-storage-state
  await page.context().storageState({ path: authFile });
});
