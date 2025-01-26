import { APIGatewayProxyHandlerV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

import { response } from "../utils";
import { handleMeRequest } from "../oauth/me";
import { OAuthProvider } from "../oauth/types";
import { GoogleLoginHandler } from "../oauth/login/google";
import { FacebookLoginHandler } from "../oauth/login/facebook";
import { GitHubLoginHandler } from "../oauth/login/github";

export { TESTING_LOCALHOST } from "../oauth/cookies";

export const oAuthHandler: APIGatewayProxyHandlerV2 = async (
  event,
  _context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  // Logging the entire event for now
  console.log(event);

  try {
    if (event.pathParameters?.proxy === OAuthProvider.Google) {
      return new GoogleLoginHandler().handleRequest(event);
    }

    if (event.pathParameters?.proxy === OAuthProvider.Facebook) {
      return new FacebookLoginHandler().handleRequest(event);
    }

    if (event.pathParameters?.proxy === OAuthProvider.GitHub) {
      return new GitHubLoginHandler().handleRequest(event);
    }

    if (event.pathParameters?.proxy === "me") {
      return await handleMeRequest(event);
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
};
