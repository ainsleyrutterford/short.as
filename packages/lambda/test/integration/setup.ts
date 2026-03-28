/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpoint = process.env.AWS_ENDPOINT_OVERRIDE;
if (!endpoint) {
  throw new Error("AWS_ENDPOINT_OVERRIDE must be set to run integration tests. See test/integration/run.sh");
}

export const URLS_TABLE_NAME = process.env.URLS_TABLE_NAME!;
export const COUNT_BUCKETS_TABLE_NAME = process.env.COUNT_BUCKETS_TABLE_NAME!;

export const testDynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ endpoint }));

const resetMoto = async () => fetch(`${endpoint}/moto-api/reset`, { method: "POST" });

const createTables = async () => {
  const ddb = new DynamoDBClient({ endpoint });
  await ddb.send(
    new CreateTableCommand({
      TableName: URLS_TABLE_NAME,
      KeySchema: [{ AttributeName: "shortUrlId", KeyType: "HASH" }],
      AttributeDefinitions: [{ AttributeName: "shortUrlId", AttributeType: "S" }],
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
};

export const resetAndSetup = async () => {
  await resetMoto();
  await createTables();
};
