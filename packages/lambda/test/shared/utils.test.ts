import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { replaceUrlSafeEncoding, parseBody } from "../../src/utils";

describe("replaceUrlSafeEncoding", () => {
  it("should replace URL-safe base64 characters with standard base64", () => {
    expect(replaceUrlSafeEncoding("abc_def-ghi")).toBe("abc/def+ghi");
  });

  it("should handle strings with no URL-safe characters", () => {
    expect(replaceUrlSafeEncoding("abcdef")).toBe("abcdef");
  });

  it("should handle empty string", () => {
    expect(replaceUrlSafeEncoding("")).toBe("");
  });
});

describe("parseBody", () => {
  it("should parse plain JSON body", () => {
    const event = { body: '{"key":"value"}', isBase64Encoded: false } as APIGatewayProxyEventV2;
    expect(parseBody(event)).toEqual({ key: "value" });
  });

  it("should parse base64 encoded body", () => {
    const event = {
      body: Buffer.from('{"key":"value"}').toString("base64"),
      isBase64Encoded: true,
    } as APIGatewayProxyEventV2;
    expect(parseBody(event)).toEqual({ key: "value" });
  });

  it("should return empty object for undefined body", () => {
    const event = { body: undefined, isBase64Encoded: false } as APIGatewayProxyEventV2;
    expect(parseBody(event)).toEqual({});
  });
});
