import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export type Handler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2>;
