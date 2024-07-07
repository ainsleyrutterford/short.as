import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const BASE = 52;
const ENCODING_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
// 52^7 - 1
const MAX_POSSIBLE_NUM = 1028071702527;

/**
 * Returns the base52 encoding of a number. Pads with the string "a" to ensure that the
 * result always has a length of 7.
 */
export const encodeNumber = (num: number): string => {
  if (num > MAX_POSSIBLE_NUM) {
    console.warn("Encoded a number that was greater than what is representable in 7 characters");
  }

  // Padding with 'a's if the number is 0
  if (num === 0) return ENCODING_ALPHABET[0].repeat(7);

  let result = "";
  while (num > 0) {
    const remainder = num % BASE;
    result = ENCODING_ALPHABET[remainder] + result;
    num = Math.floor(num / BASE);
  }

  // Padding with 'a's if the length is less than 7
  return result.length < 7 ? "a".repeat(7 - result.length) + result : result;
};

export const getStringEnvironmentVariable = (name: string) => {
  const environmentVariable = process.env[name];
  if (environmentVariable === undefined) {
    throw new Error(`Environment variable ${name} undefined`);
  }
  return environmentVariable;
};

export const hexStringToNumber = (hex: string) => Number(`0x${hex}`);

export const getCountBucketId = (longUrl: string) => {
  const hash = crypto.createHash("sha256").update(longUrl).digest("hex");

  // 16^4 = 65,536 possible short hashes
  const shortHash = hash.slice(0, 4);
  // A number between 0 and 65,535
  return hexStringToNumber(shortHash);
};

export const createBareBonesDynamoDBDocumentClient = () => {
  // Bare-bones DynamoDB Client for smaller bundle sizes:
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/introduction/#high-level-concepts
  const dynamoClient = new DynamoDBClient({});
  // The document client simplifies working with items by abstracting away the notion of attribute values
  // https://www.npmjs.com/package/@aws-sdk/lib-dynamodb
  return DynamoDBDocumentClient.from(dynamoClient);
};
