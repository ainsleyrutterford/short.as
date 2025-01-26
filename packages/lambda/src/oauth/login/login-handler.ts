import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { nowInSeconds } from "../utils";
import { response, siteUrl } from "../../utils";
import { createOrUpdateUser } from "../user";
import { OAuthProvider, UserDdbInput } from "../types";
import { createLoggedInCookies, TESTING_LOCALHOST } from "../cookies";

export abstract class OAuthLoginHandler {
  private oAuthProvider: OAuthProvider;

  private loggedInRedirectUrl = `${
    TESTING_LOCALHOST
      ? // If we are testing in localhost, cookies don't get set until a new page is loaded, so we
        // redirect the user to a page that redirects them to create
        "https://localhost:3000"
      : siteUrl
  }/create/shorten?loggedIn=true`;

  abstract fetchUserData(now: number, code: string): Promise<UserDdbInput>;

  async handleRequest(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
    console.log(`Handling ${this.oAuthProvider} OAuth request...`);

    const now = nowInSeconds();

    const code = event.queryStringParameters?.code;
    if (!code) {
      return response({
        statusCode: 400,
        body: JSON.stringify({ message: "Missing code query string parameter" }),
      });
    }

    const user = await this.fetchUserData(now, code);

    const { id: userId, oAuthProvider, refreshTokenVersion } = await createOrUpdateUser(user);

    const loggedInCookies = await createLoggedInCookies({ now, oAuthProvider, userId, refreshTokenVersion });

    return response({ statusCode: 301, cookies: loggedInCookies, headers: { Location: this.loggedInRedirectUrl } });
  }
}
