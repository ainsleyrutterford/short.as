import httpErrorHandler from "@middy/http-error-handler";

import { middy, warmup, logResponse } from "../../middlewares";
import { createUrlForUser } from "./create-url";
import { getUrlDetails } from "./get-url";
import { listUrlsForUser } from "./list-urls";
import { updateUrlDetails } from "./update-url";
import httpRouterHandler, { Route } from "@middy/http-router";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { auth } from "../../middlewares/auth";
import { getUrlViews } from "./get-url-views";

const routes: Route<APIGatewayProxyEventV2, APIGatewayProxyResultV2>[] = [
  {
    method: "GET",
    path: "/users/urls/{shortUrlId}",
    handler: getUrlDetails,
  },
  {
    method: "GET",
    path: "/users/urls/{shortUrlId}/views",
    handler: getUrlViews,
  },
  {
    method: "PATCH",
    path: "/users/urls/{shortUrlId}",
    handler: updateUrlDetails,
  },
  {
    method: "GET",
    path: "/users/urls",
    handler: listUrlsForUser,
  },
  {
    method: "POST",
    path: "/users/urls",
    handler: createUrlForUser,
  },
];

export const handler = middy()
  .use(warmup())
  .use(auth())
  .use(httpErrorHandler())
  .use(logResponse())
  .handler(httpRouterHandler(routes));
