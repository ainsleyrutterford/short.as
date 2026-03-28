import { SSMClient } from "@aws-sdk/client-ssm";
import { endpoint } from "./config";

const createSSMClient = () => {
  console.log("Creating SSM client...");
  return new SSMClient({ endpoint });
};

export const ssmClient = createSSMClient();
