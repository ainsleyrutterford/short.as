import { normalizeOs, parseReferer, parseLocation, parseDevice } from "../../src/analytics";

describe("normalizeOs", () => {
  it("should return ios for iOS user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)")).toBe("ios");
  });

  it("should return android for Android user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (Linux; Android 13; Pixel 7)")).toBe("android");
  });

  it("should return windows for Windows user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("windows");
  });

  it("should return macos for macOS user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("macos");
  });

  it("should return linux for Linux user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (X11; Linux x86_64)")).toBe("linux");
    expect(normalizeOs("Mozilla/5.0 (X11; Ubuntu; Linux x86_64)")).toBe("linux");
  });

  it("should return chromeos for Chrome OS user agents", () => {
    expect(normalizeOs("Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)")).toBe("chromeos");
  });

  it("should return other for unknown or undefined", () => {
    expect(normalizeOs(undefined)).toBe("other");
    expect(normalizeOs("")).toBe("other");
    expect(normalizeOs("SomeUnknownBot/1.0")).toBe("other");
  });
});

describe("parseReferer", () => {
  it("should return direct for undefined referer", () => {
    expect(parseReferer(undefined)).toBe("direct");
  });

  it("should identify google", () => {
    expect(parseReferer("https://www.google.com/search?q=test")).toBe("google");
    expect(parseReferer("https://google.co.uk/")).toBe("google");
  });

  it("should identify twitter/x", () => {
    expect(parseReferer("https://twitter.com/user")).toBe("twitter");
    expect(parseReferer("https://t.co/abc123")).toBe("twitter");
    expect(parseReferer("https://x.com/user")).toBe("twitter");
  });

  it("should identify linkedin", () => {
    expect(parseReferer("https://www.linkedin.com/feed")).toBe("linkedin");
    expect(parseReferer("https://lnkd.in/abc")).toBe("linkedin");
  });

  it("should identify other social platforms", () => {
    expect(parseReferer("https://www.facebook.com/")).toBe("facebook");
    expect(parseReferer("https://www.youtube.com/watch")).toBe("youtube");
    expect(parseReferer("https://www.instagram.com/")).toBe("instagram");
    expect(parseReferer("https://www.tiktok.com/")).toBe("tiktok");
    expect(parseReferer("https://www.reddit.com/r/test")).toBe("reddit");
    expect(parseReferer("https://www.bing.com/search")).toBe("bing");
  });

  it("should return other for unknown referers", () => {
    expect(parseReferer("https://example.com/page")).toBe("other");
  });
});

describe("parseLocation", () => {
  it("should return lowercase country code for top 50 countries", () => {
    expect(parseLocation("US")).toBe("us");
    expect(parseLocation("GB")).toBe("gb");
    expect(parseLocation("DE")).toBe("de");
  });

  it("should return region for non-top-50 countries", () => {
    expect(parseLocation("ZW")).toBe("africa"); // Zimbabwe -> Africa
  });

  it("should return other for undefined", () => {
    expect(parseLocation(undefined)).toBe("other");
  });
});

describe("parseDevice", () => {
  it("should return ios when cloudfront-is-ios-viewer is true", () => {
    expect(parseDevice({ "cloudfront-is-ios-viewer": "true" })).toBe("ios");
  });

  it("should return android when cloudfront-is-android-viewer is true", () => {
    expect(parseDevice({ "cloudfront-is-android-viewer": "true" })).toBe("android");
  });

  it("should return tablet when cloudfront-is-tablet-viewer is true", () => {
    expect(parseDevice({ "cloudfront-is-tablet-viewer": "true" })).toBe("tablet");
  });

  it("should return desktop when cloudfront-is-desktop-viewer is true", () => {
    expect(parseDevice({ "cloudfront-is-desktop-viewer": "true" })).toBe("desktop");
  });

  it("should return other when no device headers match", () => {
    expect(parseDevice({})).toBe("other");
  });

  it("should prioritize ios over other devices", () => {
    expect(parseDevice({ "cloudfront-is-ios-viewer": "true", "cloudfront-is-desktop-viewer": "true" })).toBe("ios");
  });
});
