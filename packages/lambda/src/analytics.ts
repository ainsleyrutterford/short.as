import { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { createHash } from "crypto";
import { UAParser } from "ua-parser-js";
import { countries, top50Codes } from "@short-as/shared";
import { ssmClient } from "./clients/ssm";
import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { getStringEnvironmentVariable, isProd } from "./utils";
import { firehoseClient } from "./clients/firehose";
import { PutRecordCommand } from "@aws-sdk/client-firehose";

const ANALYTICS_FIREHOSE_STREAM_NAME = getStringEnvironmentVariable("ANALYTICS_FIREHOSE_STREAM_NAME");

export interface AnalyticsEvent {
  short_url_id: string;
  owning_user_id: string | undefined;
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
  is_qr_code?: boolean;
  country_code?: string;
  country_name?: string;
  region_code?: string;
  region_name?: string;
  city?: string;
  postal_code?: string;
  time_zone?: string;
  user_agent?: string;
  os?: string;
  ip_address_hash?: string;
  asn?: string;
  referer?: string;
  device?: string;
  location?: string;
  simplified_referer?: string;
  api_request_id?: string;
  lambda_request_id?: string;
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

  console.log("Fetching and caching salt...");
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
      ? // IPv6: remove last segment
        rawIp.split(":").slice(0, -1).join(":")
      : // IPv4: take first part
        rawIp.split(":")[0];

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

const normalizeOs = (userAgent: string | undefined): string => {
  const osName = new UAParser(userAgent).getOS()?.name?.toLowerCase();
  if (!osName) return "other";
  if (osName === "ios") return "ios";
  if (osName === "android") return "android";
  if (osName === "windows") return "windows";
  if (osName === "macos") return "macos";
  if (osName === "chrome os") return "chromeos";
  if (osName.includes("linux") || osName === "ubuntu" || osName === "debian" || osName === "fedora") return "linux";
  return "other";
};

const parseReferer = (referer: string | undefined) => {
  if (!referer) return "direct";

  const hostname = new URL(referer).hostname.toLowerCase();

  if (hostname.includes("google.")) return "google";
  if (hostname.includes("bing.")) return "bing";
  if (hostname.includes("facebook.")) return "facebook";
  if (hostname.includes("twitter.") || hostname === "t.co" || hostname.includes("x.com")) return "twitter";
  if (hostname.includes("linkedin.") || hostname === "lnkd.in") return "linkedin";
  if (hostname.includes("youtube.")) return "youtube";
  if (hostname.includes("instagram.")) return "instagram";
  if (hostname.includes("tiktok.")) return "tiktok";
  if (hostname.includes("reddit.")) return "reddit";

  return "other";
};

const parseLocation = (countryCode: string | undefined): string => {
  if (!countryCode) return "other";
  if (top50Codes.has(countryCode)) return countryCode.toLowerCase();
  return countries[countryCode as keyof typeof countries]?.region?.toLowerCase() ?? "other";
};

const parseDevice = (headers: Record<string, string | undefined>): string => {
  if (headers["cloudfront-is-ios-viewer"] === "true") return "ios";
  if (headers["cloudfront-is-android-viewer"] === "true") return "android";
  if (headers["cloudfront-is-tablet-viewer"] === "true") return "tablet";
  if (headers["cloudfront-is-desktop-viewer"] === "true") return "desktop";
  return "other";
};

// "jgbYXpO" -> "jg"
const getUrlPrefixBucket = (shortUrlId: string): string => shortUrlId.substring(0, 2);

// If you change anything here, you must change it in
// packages/infra/lib/constructs/analytics-aggregator.ts too!
const extractAnalytics = async (
  now: Date,
  shortUrlId: string,
  owningUserId: string | undefined,
  { headers, queryStringParameters, requestContext }: APIGatewayProxyEventV2,
  { awsRequestId }: Context,
): Promise<AnalyticsEvent> => ({
  short_url_id: shortUrlId,
  owning_user_id: owningUserId,
  url_prefix_bucket: getUrlPrefixBucket(shortUrlId),
  timestamp: now.toISOString(),
  year: now.getUTCFullYear().toString(),
  month: (now.getUTCMonth() + 1).toString().padStart(2, "0"),
  day: now.getUTCDate().toString().padStart(2, "0"),

  // Device / Browser information
  user_agent: headers["user-agent"],
  os: normalizeOs(headers["user-agent"]),
  device: parseDevice(headers),
  is_mobile: parseBoolean(headers["cloudfront-is-mobile-viewer"]),
  is_desktop: parseBoolean(headers["cloudfront-is-desktop-viewer"]),
  is_tablet: parseBoolean(headers["cloudfront-is-tablet-viewer"]),
  is_smart_tv: parseBoolean(headers["cloudfront-is-smarttv-viewer"]),
  is_android: parseBoolean(headers["cloudfront-is-android-viewer"]),
  is_ios: parseBoolean(headers["cloudfront-is-ios-viewer"]),

  // Geographic data
  location: parseLocation(headers["cloudfront-viewer-country"]),
  country_code: headers["cloudfront-viewer-country"],
  country_name: headers["cloudfront-viewer-country-name"],
  region_code: headers["cloudfront-viewer-country-region"],
  region_name: headers["cloudfront-viewer-country-region-name"],
  city: headers["cloudfront-viewer-city"],
  postal_code: headers["cloudfront-viewer-postal-code"],
  time_zone: headers["cloudfront-viewer-time-zone"],

  // Network information
  ip_address_hash: await hashIp(headers["cloudfront-viewer-address"]),
  asn: headers["cloudfront-viewer-asn"],
  referer: headers["referer"],
  simplified_referer: parseReferer(headers["referer"]),

  // Tracking
  is_qr_code: queryStringParameters?.src === "qr",
  api_request_id: requestContext?.requestId,
  lambda_request_id: awsRequestId,
});

const publishAnalytics = async (analytics: AnalyticsEvent) => {
  const response = await firehoseClient.send(
    new PutRecordCommand({
      DeliveryStreamName: ANALYTICS_FIREHOSE_STREAM_NAME,
      Record: { Data: Buffer.from(JSON.stringify(analytics) + "\n") as Uint8Array },
    }),
  );

  if (response.RecordId) console.log(`Analytics event published successfully. RecordId: ${response.RecordId}`);
};

export const extractAndPublishAnalytics = async (
  shortUrlId: string,
  owningUserId: string | undefined,
  event: APIGatewayProxyEventV2,
  context: Context,
) => {
  try {
    const analytics = await extractAnalytics(new Date(), shortUrlId, owningUserId, event, context);
    await publishAnalytics(analytics);
  } catch (error) {
    console.error(
      `Failed to publish analytics event to Firehose. shortUrlId: ${shortUrlId} headers: ${JSON.stringify(event.headers, null, 2)} ${error}`,
    );
  }
};
