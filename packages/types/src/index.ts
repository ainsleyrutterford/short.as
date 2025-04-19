export enum OAuthProvider {
  Google = "google",
  GitHub = "github",
  Facebook = "facebook",
}

export interface User {
  id: string;
  oAuthProvider: OAuthProvider;
  email: string;
  name: string;
  profilePictureUrl: string;
  firstLoginTimestamp: number;
  lastOAuthLoginTimestamp: number;
  lastRefreshLoginTimestamp: number;
  oAuthLogins: number;
  refreshTokenVersion: number;
}

export interface Url {
  shortUrlId: string;
  longUrl: string;
  clicks: number;
  qrCodeScans: number;
  totalVisits: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  owningUserId?: string;
  metadata?: Record<string, unknown>;
  history?: Record<number, string>;
}
