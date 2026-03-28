import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/get-long-url";
import { handler as createHandler } from "../../src/handlers/create-short-url";
import { resetAndSetup, testDynamoClient, getFirehoseRecords, URLS_TABLE_NAME } from "./setup";

const invoke = async (proxy?: string) => handler({ pathParameters: { proxy }, headers: {}, requestContext: {} }, {});

const createUrl = async (longUrl: string) => {
  const result = await createHandler({ body: JSON.stringify({ longUrl }), isBase64Encoded: false }, {});
  return JSON.parse(result.body).shortUrlId;
};

beforeEach(resetAndSetup);

describe("get-long-url handler", () => {
  it("should return 302 redirect for a valid short URL", async () => {
    const shortUrlId = await createUrl("https://example.com/redirect-me");
    const result = await invoke(shortUrlId);

    expect(result.statusCode).toBe(302);
    expect(result.headers?.Location).toBe("https://example.com/redirect-me");
  });

  it("should return 200 with JSON body for /details path", async () => {
    const shortUrlId = await createUrl("https://example.com/details-test");
    const result = await invoke(`${shortUrlId}/details`);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).longUrl).toBe("https://example.com/details-test");
  });

  it("should return 400 when no shortUrlId", async () => {
    const result = await invoke(undefined);
    expect(result.statusCode).toBe(400);
  });

  it("should return 404 for non-existent shortUrlId", async () => {
    const result = await invoke("zzzzzzz");
    expect(result.statusCode).toBe(404);
  });

  it("should return 404 for a soft-deleted URL", async () => {
    const shortUrlId = await createUrl("https://example.com/deleted");
    await testDynamoClient.send(
      new PutCommand({
        TableName: URLS_TABLE_NAME,
        Item: { shortUrlId, longUrl: "https://example.com/deleted", isDeleted: true },
      }),
    );

    const result = await invoke(shortUrlId);
    expect(result.statusCode).toBe(404);
  });

  it("should publish analytics to Firehose", async () => {
    const shortUrlId = await createUrl("https://example.com/analytics");
    await invoke(shortUrlId);

    const records = await getFirehoseRecords();
    expect(records.length).toBeGreaterThan(0);
    const event = JSON.parse(records[0]);
    expect(event.short_url_id).toBe(shortUrlId);
  });

  it("should return 404 after a URL is soft-deleted", async () => {
    const shortUrlId = await createUrl("https://example.com/delete-flow");
    const before = await invoke(shortUrlId);
    expect(before.statusCode).toBe(302);

    await testDynamoClient.send(
      new PutCommand({
        TableName: URLS_TABLE_NAME,
        Item: { shortUrlId, longUrl: "https://example.com/delete-flow", isDeleted: true },
      }),
    );

    const after = await invoke(shortUrlId);
    expect(after.statusCode).toBe(404);
  });
});
