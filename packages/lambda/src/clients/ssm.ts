import { SSMClient } from "@aws-sdk/client-ssm";

const createSSMClient = () => {
  console.log("Creating SSM client...");
  return new SSMClient();
};

export const ssmClient = createSSMClient();
