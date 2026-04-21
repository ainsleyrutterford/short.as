import * as cookie from "cookie";
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { OAuthProvider } from "@short-as/types";

import { nowInSeconds } from "../../utils";
import { response, siteUrl } from "../../utils";
import { createOrUpdateUser } from "../user";
import { UserDdbInput } from "../types";
import { createLoggedInCookies, TESTING_LOCALHOST } from "../cookies";

export abstract class OAuthLoginHandler {
  protected oAuthProvider: OAuthProvider | undefined;

  private loggedInRedirectUrl = `${
    TESTING_LOCALHOST
      ? // If we are testing in localhost, cookies don't get set until a new page is loaded, so we
        // redirect the user to a page that redirects them to create
        "https://localhost:3000"
      : siteUrl
  }/create/shorten?loggedIn=true`;

  abstract fetchUserData(code: string, codeVerifier?: string): Promise<UserDdbInput>;

  async handleRequest(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    console.log(`Handling ${this.oAuthProvider} OAuth request...`);

    const code = event.queryStringParameters?.code;
    if (!code) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: "Missing code query string parameter" }),
      });
    }

    // Validate state to protect against CSRF — see https://thecopenhagenbook.com/oauth
    const cookies = Object.assign({}, ...(event.cookies?.map((c) => cookie.parse(c)) ?? []));
    const state = event.queryStringParameters?.state;
    if (!state || state !== cookies.oauth_state) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid or missing state" }),
      });
    }

    const now = nowInSeconds();
    const user = await this.fetchUserData(code, cookies.oauth_code_verifier);
    const { id: userId, oAuthProvider, refreshTokenVersion } = await createOrUpdateUser(user);
    const loggedInCookies = await createLoggedInCookies({ now, oAuthProvider, userId, refreshTokenVersion });

    return response({ statusCode: 301, cookies: loggedInCookies, headers: { Location: this.loggedInRedirectUrl } });
  }
}
