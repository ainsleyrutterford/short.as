import { AuthenticatedHandler } from "../../oauth/types";

export interface Route {
  method: "GET" | "POST" | "PATCH";
  pattern: RegExp;
  handler: AuthenticatedHandler;
}
