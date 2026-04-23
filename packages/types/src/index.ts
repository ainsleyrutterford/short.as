export enum OAuthProvider {
  Google = "google",
  GitHub = "github",
  Microsoft = "microsoft",
}

export const OAUTH_ERRORS = {
  email_not_verified: "Please verify your email address with your provider before signing in.",
  oauth_failed: "Something went wrong during sign in. Please try again.",
} as const;

export type OAuthErrorCode = keyof typeof OAUTH_ERRORS;

export interface User {
  id: string;
  oAuthProvider: OAuthProvider;
  email: string;
  name: string;
  profilePictureUrl?: string;
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
  createdTimestamp: string;
  updatedTimestamp: string;
  owningUserId?: string;
  metadata?: Record<string, unknown>;
  history?: Record<string, string>;
}

export type AggregationGranularity = "hour" | "day" | "week";

export interface ViewAggregateItem {
  pk: `${AggregationGranularity}_${string}`;
  /** ISO timestamp */
  sk: string;
  /** Unix timestamp for DDB TTL */
  ttl: number;
  views: number;
  owningUserId: string;
  /** Combo counts like "us_ios": 45, "gb_android": 18 */
  [combo: string]: string | number;
}
