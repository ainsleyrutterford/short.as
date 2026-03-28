import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/create-short-url";
import { resetAndSetup, testDynamoClient, URLS_TABLE_NAME } from "./setup";

const invoke = async (body: Record<string, unknown>) => {
  const result = await handler({ body: JSON.stringify(body), isBase64Encoded: false }, {});
  return result as APIGatewayProxyStructuredResultV2;
};

beforeEach(resetAndSetup);

describe("create-short-url handler", () => {
  it("should return 200 with a short URL for a valid request", async () => {
    const result = await invoke({ longUrl: "https://example.com/my-long-url" });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body ?? "");
    expect(body.longUrl).toBe("https://example.com/my-long-url");
    expect(body.shortUrlId).toBeDefined();
    expect(body.shortUrlId.length).toBe(7);
  });

  it("should store the URL in DynamoDB", async () => {
    const result = await invoke({ longUrl: "https://example.com/stored" });
    const { shortUrlId } = JSON.parse(result.body ?? "");

    const { Item } = await testDynamoClient.send(
      new GetCommand({
        TableName: URLS_TABLE_NAME,
        Key: { shortUrlId },
      }),
    );
    expect(Item?.longUrl).toBe("https://example.com/stored");
    expect(Item?.totalVisits).toBe(0);
  });

  it("should return 400 when longUrl is missing", async () => {
    const result = await invoke({});
    expect(result.statusCode).toBe(400);
  });

  it("should handle warmup events", async () => {
    const result = await handler({ warming: true } as unknown as APIGatewayProxyEventV2, {});
    expect((result as APIGatewayProxyStructuredResultV2).body).toBe("Warming event handled");
  });
});
