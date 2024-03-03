import { Handler } from 'aws-lambda';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler: Handler = async (event, context) => {
  const list = await s3.send(new ListBucketsCommand({}));
  console.log(list);
};

export const myFunc = () => 'Hello, World!';

// const createShortUrl = (longUrl: string) => {
// };

// const serveLongUrlRedirect = (shortUrl: string) => {
//   // Fetch the long URL from the cache (Redis) or DynamoDB. Look into types of caching for DynamoDB. (Look out for pricing!)
//   // Return a 302 response to the long URL
// };
