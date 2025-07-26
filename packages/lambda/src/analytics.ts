import { APIGatewayProxyEventHeaders } from "aws-lambda";
import { createHash } from "crypto";
import { ssmClient } from "./clients/ssm";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { isProd } from "./utils";

export interface AnalyticsEvent {
  short_url_id: string;
  url_prefix_bucket: string;
  timestamp: string;
  year: string;
  month: string;
  day: string;
  is_mobile: boolean;
  is_desktop: boolean;
  is_tablet: boolean;
  is_smart_tv: boolean;
  is_android: boolean;
  is_ios: boolean;
  country_code?: string;
  country_name?: string;
  region_code?: string;
  region_name?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;
  user_agent?: string;
  ip_address_hash?: string;
  asn?: string;
  referer?: string;
}

let cachedSalt: string | undefined = undefined;

/**
 * Generated salts manually using:
 *
 * ```
 * node -e "console.log(require('crypto').randomBytes(64).toString('base64'));"
 * ```
 *
 * Then manually created dev and prod SSM Parameters to store the salts.
 *
 * The salt is cached in a global variable after it is first fetched so that other invocations
 * of this Lambda have a chance to use the cached salt rather than re-fetching it.
 */
export const fetchSalt = async (): Promise<string> => {
  if (cachedSalt) return cachedSalt;

  console.log("No cached salt found, fetching one instead...");
  const parameterName = `/${isProd ? "prod" : "dev"}/salt`;
  const response = await ssmClient.send(new GetParameterCommand({ Name: parameterName, WithDecryption: true }));
  if (!response.Parameter?.Value) {
    throw new Error(`No value found for parameter: ${parameterName}`);
  }

  cachedSalt = response.Parameter?.Value;
  return cachedSalt;
};

const hashIp = async (rawIp: string | undefined): Promise<string | undefined> => {
  if (!rawIp) return undefined;

  try {
    // Handle both IPv4 and IPv6 by removing the port (last segment after final :)
    const clientIp = rawIp.includes(":")
      ? rawIp.split(":").slice(0, -1).join(":") // IPv6: remove last segment
      : rawIp.split(":")[0]; // IPv4: take first part

    const salt = await fetchSalt();
    return createHash("sha256")
      .update(clientIp + salt)
      .digest("hex");
  } catch (error) {
    console.error("Failed to hash IP address:", error);
    return undefined;
  }
};

const parseBoolean = (value: string | undefined) => value === "true";

const parseCoordinate = (coord: string | undefined): number | undefined => {
  if (!coord) return undefined;
  const parsed = parseFloat(coord);
  return isNaN(parsed) ? undefined : parsed;
};

// "jgbYXpO" -> "jg"
const getUrlPrefixBucket = (shortUrlId: string): string => shortUrlId.substring(0, 2);

// If you change anything here, you must change it in
// packages/infra/lib/constructs/analytics-aggregator.ts too!
export const extractAnalytics = async (
  now: Date,
  shortUrlId: string,
  headers: APIGatewayProxyEventHeaders,
): Promise<AnalyticsEvent> => ({
  short_url_id: shortUrlId,
  url_prefix_bucket: getUrlPrefixBucket(shortUrlId),
  timestamp: now.toISOString(),
  year: now.getUTCFullYear().toString(),
  month: (now.getUTCMonth() + 1).toString().padStart(2, "0"),
  day: now.getUTCDate().toString().padStart(2, "0"),

  // Device / Browser information
  user_agent: headers["user-agent"],
  is_mobile: parseBoolean(headers["cloudfront-is-mobile-viewer"]),
  is_desktop: parseBoolean(headers["cloudfront-is-desktop-viewer"]),
  is_tablet: parseBoolean(headers["cloudfront-is-tablet-viewer"]),
  is_smart_tv: parseBoolean(headers["cloudfront-is-smarttv-viewer"]),
  is_android: parseBoolean(headers["cloudfront-is-android-viewer"]),
  is_ios: parseBoolean(headers["cloudfront-is-ios-viewer"]),

  // Geographic data
  country_code: headers["cloudfront-viewer-country"],
  country_name: headers["cloudfront-viewer-country-name"],
  region_code: headers["cloudfront-viewer-country-region"],
  region_name: headers["cloudfront-viewer-country-region-name"],
  city: headers["cloudfront-viewer-city"],
  postal_code: headers["cloudfront-viewer-postal-code"],
  latitude: parseCoordinate(headers["cloudfront-viewer-latitude"]),
  longitude: parseCoordinate(headers["cloudfront-viewer-longitude"]),
  time_zone: headers["cloudfront-viewer-time-zone"],

  // Network information
  ip_address_hash: await hashIp(headers["cloudfront-viewer-address"]),
  asn: headers["cloudfront-viewer-asn"],
  referer: headers["referer"],
});
