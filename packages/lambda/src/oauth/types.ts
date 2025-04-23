import type { OAuthProvider, User } from "@short-as/types";

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
