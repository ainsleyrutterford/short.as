import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { Middleware, MiddlewareContext } from "./middy";

const extractDetails = (request: MiddlewareContext<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>) => {
  const { event, response, error } = request;
  const { method, path } = event?.requestContext?.http ?? {};
  return { response, method, path, error };
};

export const logResponse = (): Middleware<APIGatewayProxyEventV2> => ({
  after: async (request) => {
    const { response, method, path } = extractDetails(request);
    console.log(`${method} ${path} returning response: ${response?.statusCode ?? 200}`);
  },
  onError: async (request) => {
    const { response, method, path, error } = extractDetails(request);
    console.log(
      `${method} ${path} returning response: ${response?.statusCode ?? 500}: ${error?.message ?? "Unknown error"}`,
    );
  },
});
