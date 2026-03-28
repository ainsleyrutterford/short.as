import * as cookie from "cookie";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/user-apis-proxy/index";
import { resetAndSetup, signTestToken, testDynamoClient, USERS_TABLE_NAME } from "./setup";

const now = () => Math.floor(Date.now() / 1000);

const invoke = (cookies: string[]) =>
  handler(
    {
      version: "2.0",
      requestContext: { http: { method: "GET", path: "/users/urls" } },
      cookies,
      isBase64Encoded: false,
    },
    {},
  );

const seedUser = async (userId: string, refreshTokenVersion = 1) => {
  await testDynamoClient.send(
    new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: {
        id: userId,
        refreshTokenVersion,
        oAuthLogins: 1,
        firstLoginTimestamp: new Date().toISOString(),
        lastOAuthLoginTimestamp: new Date().toISOString(),
      },
    }),
  );
};

beforeEach(resetAndSetup);

describe("auth middleware", () => {
  it("should return 403 when no cookies provided", async () => {
    const result = await invoke([]);
    expect(result.statusCode).toBe(403);
    expect(result.body).toContain("accessToken and refreshToken cookies required");
  });

  it("should return 403 when both tokens are expired", async () => {
    const expired = signTestToken({ userId: "test-user", oAuthProvider: "google" }, now() - 60);
    const result = await invoke([cookie.serialize("accessToken", expired), cookie.serialize("refreshToken", expired)]);
    expect(result.statusCode).toBe(403);
    expect(result.body).toContain("refreshToken is invalid");
  });

  it("should refresh tokens when access token is expired but refresh token is valid", async () => {
    await seedUser("test-user", 1);
    const expiredAccess = signTestToken({ userId: "test-user", oAuthProvider: "google" }, now() - 60);
    const validRefresh = signTestToken({ userId: "test-user", oAuthProvider: "google", version: 1 }, now() + 600);

    const result = await invoke([
      cookie.serialize("accessToken", expiredAccess),
      cookie.serialize("refreshToken", validRefresh),
    ]);

    expect(result.statusCode).toBe(200);
    // Should set new cookies in the response
    expect(result.cookies?.some((c: string) => c.startsWith("accessToken="))).toBe(true);
    expect(result.cookies?.some((c: string) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("should return 403 when refresh token version doesn't match (logged out of all devices)", async () => {
    // version 2 in DB
    await seedUser("test-user", 2);

    const expiredAccess = signTestToken({ userId: "test-user", oAuthProvider: "google" }, now() - 60);
    // version 1 in token
    const staleRefresh = signTestToken({ userId: "test-user", oAuthProvider: "google", version: 1 }, now() + 600);

    const result = await invoke([
      cookie.serialize("accessToken", expiredAccess),
      cookie.serialize("refreshToken", staleRefresh),
    ]);

    expect(result.statusCode).toBe(403);
    expect(result.body).toContain("User has logged out of all devices");
  });
});
