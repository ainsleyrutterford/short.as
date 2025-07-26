import { FirehoseTransformationHandler } from "aws-lambda";

// TODO: update DynamoDB counters and aggregations
export const handler: FirehoseTransformationHandler = async (event) => {
  console.log(event);

  return {
    records: event.records.map(({ recordId, data }) => ({
      recordId,
      result: "Ok",
      data,
    })),
  };
};
