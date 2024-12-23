import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { response } from "../../utils";
import { handleGoogleOAuthRequest } from "./providers/google";
import { handleGitHubOAuthRequest } from "./providers/github";
import { handleFacebookOAuthRequest } from "./providers/facebook";
import { OAuthProvider } from "./utils";

export const oAuthHandler: APIGatewayProxyHandlerV2 = async (event, _context) => {
  // Logging the entire event for now
  console.log(event);

  try {
    if (event.pathParameters?.proxy === OAuthProvider.Google) {
      return await handleGoogleOAuthRequest(event);
    }

    if (event.pathParameters?.proxy === OAuthProvider.Facebook) {
      return await handleFacebookOAuthRequest(event);
    }

    if (event.pathParameters?.proxy === OAuthProvider.GitHub) {
      return await handleGitHubOAuthRequest(event);
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
