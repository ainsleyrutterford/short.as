import type { OAuthProvider, User } from "@short-as/types";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export interface AccessToken {
  userId: string;
  oAuthProvider: OAuthProvider;
}

export interface RefreshToken extends AccessToken {
  version: number;
}

export type UserDdbInput = Omit<
  User,
  | "oAuthLogins"
  | "refreshTokenVersion"
  | "firstLoginTimestamp"
  | "lastOAuthLoginTimestamp"
  | "lastRefreshLoginTimestamp"
>;

export type APIGatewayProxyEventV2WithAuth = APIGatewayProxyEventV2 & {
  auth?: { user?: User; userId?: string };
};

export type AuthenticatedHandler = (event: APIGatewayProxyEventV2WithAuth) => Promise<APIGatewayProxyResultV2>;
