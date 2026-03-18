import { getTimeBucket } from "../../src/handlers/analytics-aggregator";

describe("getTimeBucket", () => {
  it("should bucket by hour", () => {
    expect(getTimeBucket("hour", "2024-03-15T14:35:22.000Z")).toBe("2024-03-15T14:00:00.000Z");
  });

  it("should bucket by day", () => {
    expect(getTimeBucket("day", "2024-03-15T14:35:22.000Z")).toBe("2024-03-15T00:00:00.000Z");
  });

  it("should bucket by week (Monday start)", () => {
    // March 15, 2024 is a Friday, so week starts March 11 (Monday)
    expect(getTimeBucket("week", "2024-03-15T14:35:22.000Z")).toBe("2024-03-11T00:00:00.000Z");
  });
});
