import { getTimeBucket, compileIncrements } from "../../src/handlers/analytics-aggregator";
import { AnalyticsEvent } from "../../src/analytics";

describe("getTimeBucket", () => {
  it("should bucket by hour", () => {
    expect(getTimeBucket("hour", "2026-03-15T14:35:22.000Z")).toBe("2026-03-15T14:00:00.000Z");
  });

  it("should bucket by day", () => {
    expect(getTimeBucket("day", "2026-03-15T14:35:22.000Z")).toBe("2026-03-15T00:00:00.000Z");
  });

  it("should bucket by week (Monday start)", () => {
    // March 15, 2026 is a Sunday, so week starts March 9 (Monday)
    expect(getTimeBucket("week", "2026-03-15T14:35:22.000Z")).toBe("2026-03-09T00:00:00.000Z");
  });

  it("should handle Sunday correctly for week bucket", () => {
    // March 22, 2026 is a Sunday, week starts March 16 (Monday)
    expect(getTimeBucket("week", "2026-03-22T23:59:59.000Z")).toBe("2026-03-16T00:00:00.000Z");
  });

  it("should handle Monday correctly for week bucket", () => {
    // March 16, 2026 is a Monday — it's its own week start
    expect(getTimeBucket("week", "2026-03-16T10:00:00.000Z")).toBe("2026-03-16T00:00:00.000Z");
  });

  it("should handle midnight exactly", () => {
    expect(getTimeBucket("hour", "2026-03-15T00:00:00.000Z")).toBe("2026-03-15T00:00:00.000Z");
    expect(getTimeBucket("day", "2026-03-15T00:00:00.000Z")).toBe("2026-03-15T00:00:00.000Z");
  });

  it("should handle year boundary", () => {
    // Dec 31, 2026 is a Thursday, week starts Dec 28 (Monday)
    expect(getTimeBucket("week", "2026-12-31T23:59:59.000Z")).toBe("2026-12-28T00:00:00.000Z");
    expect(getTimeBucket("day", "2026-01-01T05:30:00.000Z")).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("compileIncrements", () => {
  const makeEvent = (overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent => ({
    short_url_id: "abc",
    owning_user_id: "user1",
    url_prefix_bucket: "ab",
    timestamp: "2026-03-15T14:00:00.000Z",
    year: "2026",
    month: "03",
    day: "15",
    is_mobile: false,
    is_desktop: true,
    is_tablet: false,
    is_smart_tv: false,
    is_android: false,
    is_ios: false,
    location: "us",
    device: "desktop",
    simplified_referer: "google",
    ...overrides,
  });

  it("should count a single event", () => {
    const result = compileIncrements([makeEvent()]);
    expect(result.get("us_desktop_google")).toBe(1);
  });

  it("should aggregate duplicate combinations", () => {
    const result = compileIncrements([makeEvent(), makeEvent(), makeEvent()]);
    expect(result.get("us_desktop_google")).toBe(3);
  });

  it("should separate different combinations", () => {
    const result = compileIncrements([
      makeEvent({ location: "us", device: "desktop", simplified_referer: "google" }),
      makeEvent({ location: "gb", device: "ios", simplified_referer: "twitter" }),
    ]);
    expect(result.get("us_desktop_google")).toBe(1);
    expect(result.get("gb_ios_twitter")).toBe(1);
  });

  it("should default missing fields to other", () => {
    const result = compileIncrements([
      makeEvent({ location: undefined, device: undefined, simplified_referer: undefined }),
    ]);
    expect(result.get("other_other_other")).toBe(1);
  });

  it("should lowercase location", () => {
    const result = compileIncrements([makeEvent({ location: "US" })]);
    expect(result.get("us_desktop_google")).toBe(1);
  });
});
