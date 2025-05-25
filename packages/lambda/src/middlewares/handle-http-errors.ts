import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Middleware } from "./middy";

export const handleHttpErrors = (): Middleware<APIGatewayProxyEventV2> => ({
  onError: async (request) => {
    if (request.response !== undefined) return;

    console.error(request.error);

    // if (!request.error.statusCode) {
    // }
  },
});
