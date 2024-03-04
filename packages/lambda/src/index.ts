import crypto from "crypto";
import { Handler } from 'aws-lambda';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

const BASE = 52;
const ENCODING_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
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

  let result = '';
  while (num > 0) {
    const remainder = num % BASE;
    result = ENCODING_ALPHABET[remainder] + result;
    num = Math.floor(num / BASE);
  }

  // Padding with 'a's if the length is less than 7
  return result.length < 7 ? 'a'.repeat(7 - result.length) + result : result;
};

const hexStringToNumber = (hex: string) => Number(`0x${hex}`);

export const handler: Handler = async (event, context) => {
  const { longUrl } = event;

  console.log('Entered test handler.');
  console.log('Long URL: ', longUrl);

  const hash = crypto.createHash("sha256").update(longUrl).digest("hex");

  // 16^4 = 65,536 possible short hashes
  const shortHash = hash.slice(0, 4);
  const countBucket = hexStringToNumber(shortHash);
  
  console.log(shortHash);
  // Each counter can reach up to 15,000,000
  console.log(countBucket);

  const shortUrl = encodeNumber(countBucket * 15000000);

  return shortUrl;
};

// const s3 = new S3Client({});

// export const handler: Handler = async (event, context) => {
//   const list = await s3.send(new ListBucketsCommand({}));
//   console.log(list);
// };

// const createShortUrl = (longUrl: string) => {
// };

// const serveLongUrlRedirect = (shortUrl: string) => {
//   // Fetch the long URL from the cache (Redis) or DynamoDB. Look into types of caching for DynamoDB. (Look out for pricing!)
//   // Return a 302 response to the long URL
// };
