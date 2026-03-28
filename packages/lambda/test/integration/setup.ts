/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SSMClient, PutParameterCommand } from "@aws-sdk/client-ssm";
import { FirehoseClient, CreateDeliveryStreamCommand } from "@aws-sdk/client-firehose";
import { S3Client, CreateBucketCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { KJUR } from "jsrsasign";
import * as cookie from "cookie";

const endpoint = process.env.AWS_ENDPOINT_OVERRIDE;
if (!endpoint) {
  throw new Error("AWS_ENDPOINT_OVERRIDE must be set to run integration tests. See test/integration/run.sh");
}

export const URLS_TABLE_NAME = process.env.URLS_TABLE_NAME!;
export const COUNT_BUCKETS_TABLE_NAME = process.env.COUNT_BUCKETS_TABLE_NAME!;
export const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;
export const AGGREGATION_TABLE_NAME = process.env.AGGREGATION_TABLE_NAME!;
export const USER_ID_GSI_NAME = process.env.USER_ID_GSI_NAME!;
export const ANALYTICS_FIREHOSE_STREAM_NAME = process.env.ANALYTICS_FIREHOSE_STREAM_NAME!;
const FIREHOSE_BUCKET = "test-firehose-bucket";

export const testDynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ endpoint }));

const resetMoto = async () => {
  const res = await fetch(`${endpoint}/moto-api/reset`, { method: "POST" });
  await res.text();
};

const TEST_JWT_SIGNING_KEY = "test-signing-key-at-least-32-bytes-long-for-hs256";
const TEST_SALT = "test-salt-for-hashing";

const createTables = async () => {
  const ddb = new DynamoDBClient({ endpoint });
  await ddb.send(
    new CreateTableCommand({
      TableName: URLS_TABLE_NAME,
      KeySchema: [{ AttributeName: "shortUrlId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "shortUrlId", AttributeType: "S" },
        { AttributeName: "owningUserId", AttributeType: "S" },
        { AttributeName: "createdTimestamp", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: USER_ID_GSI_NAME,
          KeySchema: [
            { AttributeName: "owningUserId", KeyType: "HASH" },
            { AttributeName: "createdTimestamp", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
        },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
  await ddb.send(
    new CreateTableCommand({
      TableName: COUNT_BUCKETS_TABLE_NAME,
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "N" }],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
  await ddb.send(
    new CreateTableCommand({
      TableName: USERS_TABLE_NAME,
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
  await ddb.send(
    new CreateTableCommand({
      TableName: AGGREGATION_TABLE_NAME,
      KeySchema: [
        { AttributeName: "pk", KeyType: "HASH" },
        { AttributeName: "sk", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "pk", AttributeType: "S" },
        { AttributeName: "sk", AttributeType: "S" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
};

const createSSMParams = async () => {
  const ssm = new SSMClient({ endpoint, region: "us-east-1" });
  await ssm.send(
    new PutParameterCommand({ Name: "/dev/oauth/jwt-signing-key", Value: TEST_JWT_SIGNING_KEY, Type: "String" }),
  );
  await ssm.send(new PutParameterCommand({ Name: "/dev/salt", Value: TEST_SALT, Type: "String" }));
};

const createFirehoseStream = async () => {
  const s3 = new S3Client({ endpoint, region: "us-east-1", forcePathStyle: true });
  await s3.send(new CreateBucketCommand({ Bucket: FIREHOSE_BUCKET }));
  const firehose = new FirehoseClient({ endpoint, region: "us-east-1" });
  await firehose.send(
    new CreateDeliveryStreamCommand({
      DeliveryStreamName: ANALYTICS_FIREHOSE_STREAM_NAME,
      ExtendedS3DestinationConfiguration: {
        RoleARN: "arn:aws:iam::012345678901:role/fake",
        BucketARN: `arn:aws:s3:::${FIREHOSE_BUCKET}`,
      },
    }),
  );
};

/** Returns all records written to the Firehose S3 destination bucket */
export const getFirehoseRecords = async (): Promise<string[]> => {
  const s3 = new S3Client({ endpoint, region: "us-east-1", forcePathStyle: true });
  const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: FIREHOSE_BUCKET }));
  if (!Contents?.length) return [];
  const records: string[] = [];
  for (const obj of Contents) {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: FIREHOSE_BUCKET, Key: obj.Key }));
    records.push(await Body!.transformToString());
  }
  return records;
};

export const resetAndSetup = async () => {
  await resetMoto();
  await createTables();
  await createSSMParams();
  await createFirehoseStream();
};

export const getTestAuthCookies = (userId: string) => {
  const now = Math.floor(Date.now() / 1000);
  const token = signTestToken({ userId, oAuthProvider: "google" }, now + 600);
  return [cookie.serialize("accessToken", token), cookie.serialize("refreshToken", token)];
};

export const signTestToken = (payload: Record<string, unknown>, exp: number) => {
  const now = Math.floor(Date.now() / 1000);
  return KJUR.jws.JWS.sign(
    "HS256",
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
    JSON.stringify({ ...payload, iat: now, exp }),
    TEST_JWT_SIGNING_KEY,
  );
};
