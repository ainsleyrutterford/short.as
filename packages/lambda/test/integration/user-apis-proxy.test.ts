import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/user-apis-proxy/index";
import { handler as createHandler } from "../../src/handlers/create-short-url";
import { resetAndSetup, testDynamoClient, getTestAuthCookies, URLS_TABLE_NAME, AGGREGATION_TABLE_NAME } from "./setup";

const cookies = getTestAuthCookies("test-user");

const invoke = (
  method: string,
  path: string,
  opts: {
    cookies?: string[];
    body?: Record<string, unknown>;
    pathParameters?: Record<string, string>;
    queryStringParameters?: Record<string, string>;
  } = {},
) =>
  handler(
    {
      version: "2.0",
      requestContext: { http: { method, path } },
      pathParameters: opts.pathParameters,
      queryStringParameters: opts.queryStringParameters,
      cookies: opts.cookies ?? cookies,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      isBase64Encoded: false,
    },
    {},
  );

const createOwnedUrl = async (longUrl: string, userId = "test-user") => {
  const result = await createHandler({ body: JSON.stringify({ longUrl }), isBase64Encoded: false }, {});
  const { shortUrlId } = JSON.parse(result.body);
  // The public create-short-url handler doesn't set owningUserId (only the
  // auth-protected user-apis-proxy/create-url does), so we overwrite the item
  // with the userId to set up ownership for tests that check it.
  await testDynamoClient.send(
    new PutCommand({
      TableName: URLS_TABLE_NAME,
      Item: {
        shortUrlId,
        longUrl,
        owningUserId: userId,
        clicks: 0,
        totalVisits: 0,
        qrCodeScans: 0,
        createdTimestamp: new Date().toISOString(),
        updatedTimestamp: new Date().toISOString(),
      },
    }),
  );
  return shortUrlId;
};

beforeEach(resetAndSetup);

describe("user-apis-proxy/create-url", () => {
  it("should create a URL owned by the authenticated user", async () => {
    const result = await invoke("POST", "/users/urls", { body: { longUrl: "https://example.com/owned" } });

    expect(result.statusCode).toBe(200);
    const { shortUrlId } = JSON.parse(result.body);
    const { Item } = await testDynamoClient.send(new GetCommand({ TableName: URLS_TABLE_NAME, Key: { shortUrlId } }));
    expect(Item?.owningUserId).toBe("test-user");
  });
});

describe("user-apis-proxy/list-urls", () => {
  it("should return only URLs owned by the user", async () => {
    await createOwnedUrl("https://example.com/mine", "test-user");
    await createOwnedUrl("https://example.com/theirs", "other-user");

    const result = await invoke("GET", "/users/urls");
    const urls = JSON.parse(result.body);
    expect(urls.length).toBe(1);
    expect(urls[0].longUrl).toBe("https://example.com/mine");
  });

  it("should exclude soft-deleted URLs", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/deleted");
    await testDynamoClient.send(
      new PutCommand({
        TableName: URLS_TABLE_NAME,
        Item: {
          shortUrlId,
          longUrl: "https://example.com/deleted",
          owningUserId: "test-user",
          isDeleted: true,
          createdTimestamp: new Date().toISOString(),
          updatedTimestamp: new Date().toISOString(),
        },
      }),
    );

    const result = await invoke("GET", "/users/urls");
    expect(JSON.parse(result.body).length).toBe(0);
  });

  it("should return empty array when user has no URLs", async () => {
    const result = await invoke("GET", "/users/urls");
    expect(JSON.parse(result.body)).toEqual([]);
  });
});

describe("user-apis-proxy/get-url", () => {
  it("should return URL details for the owner", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/details");
    const result = await invoke("GET", `/users/urls/${shortUrlId}`, { pathParameters: { shortUrlId } });

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).longUrl).toBe("https://example.com/details");
  });

  it("should return 403 when user doesn't own the URL", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/not-mine", "other-user");
    const result = await invoke("GET", `/users/urls/${shortUrlId}`, { pathParameters: { shortUrlId } });
    expect(result.statusCode).toBe(403);
  });
});

describe("user-apis-proxy/update-url", () => {
  it("should update longUrl and store previous URL in history", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/old");
    const result = await invoke("PATCH", `/users/urls/${shortUrlId}`, {
      pathParameters: { shortUrlId },
      body: { longUrl: "https://example.com/new" },
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.longUrl).toBe("https://example.com/new");
    expect(Object.values(body.history)).toEqual(["https://example.com/old"]);
  });

  it("should accumulate history across multiple updates", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/v1");
    await invoke("PATCH", `/users/urls/${shortUrlId}`, {
      pathParameters: { shortUrlId },
      body: { longUrl: "https://example.com/v2" },
    });
    const result = await invoke("PATCH", `/users/urls/${shortUrlId}`, {
      pathParameters: { shortUrlId },
      body: { longUrl: "https://example.com/v3" },
    });

    const body = JSON.parse(result.body);
    expect(body.longUrl).toBe("https://example.com/v3");
    const historyEntries = Object.entries(body.history).sort(([a], [b]) => b.localeCompare(a));
    expect(historyEntries.map(([, url]) => url)).toEqual(["https://example.com/v2", "https://example.com/v1"]);
  });

  it("should return 403 when user doesn't own the URL", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/not-mine", "other-user");
    const result = await invoke("PATCH", `/users/urls/${shortUrlId}`, {
      pathParameters: { shortUrlId },
      body: { longUrl: "https://example.com/hacked" },
    });
    expect(result.statusCode).toBe(403);
  });

  it("should return 400 when longUrl is missing", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/no-body");
    const result = await invoke("PATCH", `/users/urls/${shortUrlId}`, { pathParameters: { shortUrlId }, body: {} });
    expect(result.statusCode).toBe(400);
  });
});

describe("user-apis-proxy/delete-url", () => {
  it("should soft-delete the URL", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/to-delete");
    const result = await invoke("DELETE", `/users/urls/${shortUrlId}`, { pathParameters: { shortUrlId } });

    expect(result.statusCode).toBe(204);
    const { Item } = await testDynamoClient.send(new GetCommand({ TableName: URLS_TABLE_NAME, Key: { shortUrlId } }));
    expect(Item?.isDeleted).toBe(true);
  });

  it("should return 403 when user doesn't own the URL", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/not-mine", "other-user");
    const result = await invoke("DELETE", `/users/urls/${shortUrlId}`, { pathParameters: { shortUrlId } });
    expect(result.statusCode).toBe(403);
  });
});

describe("user-apis-proxy/get-url-views", () => {
  it("should return view aggregates", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/views");
    await testDynamoClient.send(
      new PutCommand({
        TableName: AGGREGATION_TABLE_NAME,
        Item: { pk: `hour_${shortUrlId}`, sk: "2026-01-01T00:00:00.000Z", views: 42 },
      }),
    );

    const result = await invoke("GET", `/users/urls/${shortUrlId}/views`, {
      pathParameters: { shortUrlId },
      queryStringParameters: {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2027-01-01T00:00:00.000Z",
        interval: "hour",
      },
    });

    expect(result.statusCode).toBe(200);
    const views = JSON.parse(result.body);
    expect(views.length).toBe(1);
    expect(views[0].views).toBe(42);
  });

  it("should return empty array when no views exist", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/no-views");
    const result = await invoke("GET", `/users/urls/${shortUrlId}/views`, {
      pathParameters: { shortUrlId },
      queryStringParameters: { startDate: "2025-01-01T00:00:00.000Z", endDate: "2027-01-01T00:00:00.000Z" },
    });

    expect(JSON.parse(result.body)).toEqual([]);
  });

  it("should respect startDate/endDate query params", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/date-filter");
    await testDynamoClient.send(
      new PutCommand({
        TableName: AGGREGATION_TABLE_NAME,
        Item: { pk: `hour_${shortUrlId}`, sk: "2026-01-01T00:00:00.000Z", views: 10 },
      }),
    );
    await testDynamoClient.send(
      new PutCommand({
        TableName: AGGREGATION_TABLE_NAME,
        Item: { pk: `hour_${shortUrlId}`, sk: "2026-06-01T00:00:00.000Z", views: 20 },
      }),
    );

    const result = await invoke("GET", `/users/urls/${shortUrlId}/views`, {
      pathParameters: { shortUrlId },
      queryStringParameters: {
        startDate: "2026-05-01T00:00:00.000Z",
        endDate: "2026-07-01T00:00:00.000Z",
        interval: "hour",
      },
    });

    const views = JSON.parse(result.body);
    expect(views.length).toBe(1);
    expect(views[0].views).toBe(20);
  });

  it("should return 403 when user doesn't own the URL", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/not-mine", "other-user");
    const result = await invoke("GET", `/users/urls/${shortUrlId}/views`, {
      pathParameters: { shortUrlId },
      queryStringParameters: { startDate: "2025-01-01T00:00:00.000Z", endDate: "2027-01-01T00:00:00.000Z" },
    });
    expect(result.statusCode).toBe(403);
  });

  it("should only return aggregates for the requested interval", async () => {
    const shortUrlId = await createOwnedUrl("https://example.com/intervals");
    const sk = "2026-01-01T00:00:00.000Z";
    await testDynamoClient.send(
      new PutCommand({ TableName: AGGREGATION_TABLE_NAME, Item: { pk: `hour_${shortUrlId}`, sk, views: 10 } }),
    );
    await testDynamoClient.send(
      new PutCommand({ TableName: AGGREGATION_TABLE_NAME, Item: { pk: `day_${shortUrlId}`, sk, views: 100 } }),
    );
    await testDynamoClient.send(
      new PutCommand({ TableName: AGGREGATION_TABLE_NAME, Item: { pk: `week_${shortUrlId}`, sk, views: 500 } }),
    );

    const result = await invoke("GET", `/users/urls/${shortUrlId}/views`, {
      pathParameters: { shortUrlId },
      queryStringParameters: {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2027-01-01T00:00:00.000Z",
        interval: "day",
      },
    });

    const views = JSON.parse(result.body);
    expect(views.length).toBe(1);
    expect(views[0].views).toBe(100);
  });
});
