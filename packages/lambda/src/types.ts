import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";

export type Handler = (event: APIGatewayProxyEventV2, context: Context) => Promise<APIGatewayProxyResultV2>;
