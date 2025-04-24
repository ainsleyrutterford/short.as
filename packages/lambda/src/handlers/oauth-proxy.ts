import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { OAuthProvider } from "@short-as/types";

import { response, warmingWrapper } from "../utils";
import { handleMeRequest } from "../oauth/me";
import { GoogleLoginHandler } from "../oauth/login/google";
import { FacebookLoginHandler } from "../oauth/login/facebook";
import { GitHubLoginHandler } from "../oauth/login/github";
import { handleLogoutRequest } from "../oauth/logout";

export { TESTING_LOCALHOST } from "../oauth/cookies";

export const handler = warmingWrapper(async (event, _context): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    // Logging the entire event for now
    console.log(event);

    const proxy = event.pathParameters?.proxy;

    if (proxy === OAuthProvider.Google) {
      return new GoogleLoginHandler().handleRequest(event);
    }

    if (proxy === OAuthProvider.Facebook) {
      return new FacebookLoginHandler().handleRequest(event);
    }

    if (proxy === OAuthProvider.GitHub) {
      return new GitHubLoginHandler().handleRequest(event);
    }

    if (proxy === "me") {
      return handleMeRequest(event);
    }

    if (proxy === "logout" && event.requestContext.http.method === "POST") {
      return handleLogoutRequest(event);
    }

    return response({
      statusCode: 404,
      body: JSON.stringify({ message: "Unknown OAuth endpoint" }),
    });
  } catch (error) {
    console.error(error);
    return response({
      statusCode: 500,
      body: JSON.stringify({ message: "An internal server error occurred while handling the OAuth request" }),
    });
  }
});
