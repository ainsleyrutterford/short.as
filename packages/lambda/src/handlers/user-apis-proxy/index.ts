import { authWrapper } from "../../oauth/auth-wrapper";
import { warmingWrapper } from "../../utils";
import { createUrlForUser } from "./create-url";
import { getUrlDetails } from "./get-url";
import { listUrlsForUser } from "./list-urls";
import { Route } from "./types";
import { updateUrlDetails } from "./update-url";

// These RegExs are explained here: https://regex101.com/r/6ZmWMR/1
const routes: Route[] = [
  {
    method: "GET",
    pattern: /urls\/(?<shortUrlId>[^/]+)$/,
    handler: getUrlDetails,
  },
  {
    method: "PATCH",
    pattern: /urls\/(?<shortUrlId>[^/]+)$/,
    handler: updateUrlDetails,
  },
  {
    method: "GET",
    pattern: /urls$/,
    handler: listUrlsForUser,
  },
  {
    method: "POST",
    pattern: /urls$/,
    handler: createUrlForUser,
  },
];

export const handler = warmingWrapper(async (event) =>
  authWrapper(event, async ({ userId, responseWithCookies }) => {
    try {
      // Logging the entire event for now
      console.log(event);

      const proxy = event.pathParameters?.proxy ?? "";
      const httpMethod = event.requestContext?.http?.method;

      for (const { method, pattern, handler } of routes) {
        if (httpMethod !== method) continue;

        const match = pattern.exec(proxy);
        if (!match) continue;

        return handler({ event, userId, shortUrlId: match.groups?.shortUrlId, responseWithCookies });
      }

      return responseWithCookies({
        statusCode: 404,
        body: JSON.stringify({ message: "Unknown user API endpoint" }),
      });
    } catch (error) {
      console.error(error);
      return responseWithCookies({
        statusCode: 500,
        body: JSON.stringify({ message: "An internal server error occurred while handling the user API request" }),
      });
    }
  }),
);
