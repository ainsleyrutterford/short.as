import { FirehoseClient } from "@aws-sdk/client-firehose";

const createFirehoseClient = () => {
  console.log("Creating Firehose client...");
  return new FirehoseClient();
};

export const firehoseClient = createFirehoseClient();
