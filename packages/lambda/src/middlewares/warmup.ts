import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Middleware } from "./middy";
import { response } from "../utils";

interface WarmingEvent {
  warming?: boolean;
}

export const warmup = (): Middleware<APIGatewayProxyEventV2> => ({
  before: async (request) => {
    if ((request.event as WarmingEvent).warming) return response({ body: "Warming event handled" });
  },
});
