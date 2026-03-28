import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/create-short-url";
import { resetAndSetup, testDynamoClient, URLS_TABLE_NAME, COUNT_BUCKETS_TABLE_NAME } from "./setup";

const invoke = async (body: Record<string, unknown>) => {
  const result = await handler({ body: JSON.stringify(body), isBase64Encoded: false }, {});
  return result as APIGatewayProxyStructuredResultV2;
};

beforeEach(resetAndSetup);

describe("create-short-url handler", () => {
  it("should return 200 with a valid short URL and create a bucket item", async () => {
    const result = await invoke({ longUrl: "https://example.com/my-long-url" });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body ?? "");
    expect(body.longUrl).toBe("https://example.com/my-long-url");
    expect(body.shortUrlId).toBeDefined();
    expect(body.shortUrlId.length).toBe(7);
    expect(body.clicks).toBe(0);
    expect(body.totalVisits).toBe(0);
    expect(body.qrCodeScans).toBe(0);
    expect(body.createdTimestamp).toBeDefined();
    expect(body.updatedTimestamp).toBeDefined();

    // Verify URL item in DynamoDB
    const { Item: urlItem } = await testDynamoClient.send(
      new GetCommand({
        TableName: URLS_TABLE_NAME,
        Key: { shortUrlId: body.shortUrlId },
      }),
    );
    expect(urlItem?.longUrl).toBe("https://example.com/my-long-url");
    expect(urlItem?.totalVisits).toBe(0);
    expect(urlItem?.owningUserId).toBeUndefined();

    // Verify a bucket was created with count 1
    const { Items } = await testDynamoClient.send(new ScanCommand({ TableName: COUNT_BUCKETS_TABLE_NAME }));
    expect(Items?.length).toBe(1);
    expect(Items?.[0].count).toBe(1);
  });

  it("should increment an existing bucket's count", async () => {
    await invoke({ longUrl: "https://example.com/first" });
    await invoke({ longUrl: "https://example.com/second" });

    const { Items } = await testDynamoClient.send(new ScanCommand({ TableName: COUNT_BUCKETS_TABLE_NAME }));
    // Either the same bucket was incremented to 2, or a second bucket was created
    const totalCount = Items?.reduce((sum, item) => sum + item.count, 0);
    expect(totalCount).toBe(2);
  });

  it("should return 400 when longUrl is missing", async () => {
    const result = await invoke({});
    expect(result.statusCode).toBe(400);
  });

  it("should return 400 for empty longUrl", async () => {
    const result = await invoke({ longUrl: "" });
    expect(result.statusCode).toBe(400);
  });

  it("should handle warmup events", async () => {
    const result = await handler({ warming: true } as unknown as APIGatewayProxyEventV2, {});
    expect((result as APIGatewayProxyStructuredResultV2).body).toBe("Warming event handled");
  });

  it("should return 500 when a corrupt bucket is detected", async () => {
    // Pre-seed that URL so the URL Put fails but the bucket condition passes
    await testDynamoClient.send(
      new PutCommand({
        TableName: URLS_TABLE_NAME,
        Item: { shortUrlId: "aaaaaaa", longUrl: "https://collision.com" },
      }),
    );

    // Force it to use bucket 0 which has count 0, so encodeNumber(0) will return "aaaaaaa"
    process.env.COUNT_BUCKET_ID_OVERRIDE = "0";

    const result = await invoke({ longUrl: "https://example.com/corrupt" });
    expect(result.statusCode).toBe(500);
    delete process.env.COUNT_BUCKET_ID_OVERRIDE;
  });
});
