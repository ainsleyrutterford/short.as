export enum OAuthProvider {
  Google = "google",
  GitHub = "github",
  Facebook = "facebook",
}

export interface AccessToken {
  userId: string;
  oAuthProvider: OAuthProvider;
}

export interface RefreshToken extends AccessToken {
  version: number;
}

export interface User {
  id: string;
  oAuthProvider: OAuthProvider;
  email: string;
  name: string;
  profilePictureUrl: string;
  lastOAuthLoginTime: number;
  lastRefreshLoginTime: number;
  oAuthLogins: number;
  refreshTokenVersion: number;
}

export type UserDdbInput = Omit<User, "oAuthLogins" | "refreshTokenVersion">;
