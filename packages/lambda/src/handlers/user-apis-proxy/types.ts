import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

export type UserApiCallback = ({
  event,
  userId,
  shortUrlId,
  responseWithCookies,
}: {
  event: APIGatewayProxyEventV2;
  userId: string;
  shortUrlId?: string;
  responseWithCookies: (value: APIGatewayProxyStructuredResultV2) => APIGatewayProxyStructuredResultV2;
}) => Promise<APIGatewayProxyStructuredResultV2>;

export interface Route {
  method: "GET" | "POST" | "PATCH";
  pattern: RegExp;
  handler: UserApiCallback;
}
