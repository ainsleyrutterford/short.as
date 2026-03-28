import { FirehoseClient } from "@aws-sdk/client-firehose";
import { endpoint } from "./config";

const createFirehoseClient = () => {
  console.log("Creating Firehose client...");
  return new FirehoseClient({ endpoint });
};

export const firehoseClient = createFirehoseClient();
