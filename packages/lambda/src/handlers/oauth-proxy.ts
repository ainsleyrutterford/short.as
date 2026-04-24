import httpErrorHandler from "@middy/http-error-handler";

import { middy, warmup, logResponse } from "../middlewares";
import { handleMeRequest } from "../oauth/me";
import { GoogleLoginHandler } from "../oauth/login/google";
import { GitHubLoginHandler } from "../oauth/login/github";
import { MicrosoftLoginHandler } from "../oauth/login/microsoft";
import { handleLogoutRequest } from "../oauth/logout";
import { handleOAuthStart } from "../oauth/start";

import httpRouterHandler, { Route } from "@middy/http-router";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { auth } from "../middlewares/auth";

const routes: Route<APIGatewayProxyEventV2, APIGatewayProxyResultV2>[] = [
  {
    method: "GET",
    path: "/oauth/start",
    handler: handleOAuthStart,
  },
  {
    method: "GET",
    path: "/oauth/google",
    handler: (event: APIGatewayProxyEventV2) => new GoogleLoginHandler().handleRequest(event),
  },
  {
    method: "GET",
    path: "/oauth/microsoft",
    handler: (event: APIGatewayProxyEventV2) => new MicrosoftLoginHandler().handleRequest(event),
  },
  {
    method: "GET",
    path: "/oauth/github",
    handler: (event: APIGatewayProxyEventV2) => new GitHubLoginHandler().handleRequest(event),
  },
  {
    method: "GET",
    path: "/oauth/me",
    handler: middy().use(auth()).handler(handleMeRequest),
  },
  {
    method: "POST",
    path: "/oauth/logout",
    handler: handleLogoutRequest,
  },
];

export const handler = middy()
  .use(warmup())
  .use(httpErrorHandler())
  .use(logResponse())
  .handler(httpRouterHandler(routes));
