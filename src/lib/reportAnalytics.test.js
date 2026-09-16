import { describe, it, expect } from "vitest";
import { buildDailyTrend, buildResolutionTimeByCategory } from "./reportAnalytics";

describe("buildDailyTrend", () => {
  it("returns one bucket per day, oldest first, all zeroed when there are no issues", () => {
    const buckets = buildDailyTrend([], 5);
    expect(buckets).toHaveLength(5);
    expect(buckets.every((b) => b.reports === 0)).toBe(true);
    expect(buckets[4].key).toBe(new Date().toISOString().slice(0, 10));
  });

  it("counts an issue into the bucket matching its created_date", () => {
    const today = new Date().toISOString();
    const buckets = buildDailyTrend([{ created_date: today }, { created_date: today }], 3);
    expect(buckets[buckets.length - 1].reports).toBe(2);
    expect(buckets[0].reports).toBe(0);
  });

  it("ignores issues outside the requested window", () => {
    const longAgo = new Date(Date.now() - 365 * 86400000).toISOString();
    const buckets = buildDailyTrend([{ created_date: longAgo }], 7);
    expect(buckets.reduce((sum, b) => sum + b.reports, 0)).toBe(0);
  });

  it("ignores issues with no created_date instead of throwing", () => {
    expect(() => buildDailyTrend([{ created_date: null }, {}], 3)).not.toThrow();
  });
});

describe("buildResolutionTimeByCategory", () => {
  it("only counts completed issues with both created_date and resolved_date", () => {
    const result = buildResolutionTimeByCategory([
      { status: "pending", problem_type: "pollution_zones", created_date: "2026-01-01", resolved_date: "2026-01-03" },
      { status: "completed", problem_type: "pollution_zones", created_date: "2026-01-01" }, // missing resolved_date
      { status: "completed", problem_type: "pollution_zones", created_date: "2026-01-01", resolved_date: "2026-01-04" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].avgDays).toBe(3);
  });

  it("averages multiple resolved issues in the same category", () => {
    const result = buildResolutionTimeByCategory([
      { status: "completed", problem_type: "slum_watch", created_date: "2026-01-01T00:00:00Z", resolved_date: "2026-01-02T00:00:00Z" }, // 1 day
      { status: "completed", problem_type: "slum_watch", created_date: "2026-01-01T00:00:00Z", resolved_date: "2026-01-04T00:00:00Z" }, // 3 days
    ]);
    expect(result[0].avgDays).toBe(2);
  });

  it("sorts categories by average resolution time, slowest first", () => {
    const result = buildResolutionTimeByCategory([
      { status: "completed", problem_type: "slum_watch", created_date: "2026-01-01", resolved_date: "2026-01-02" },
      { status: "completed", problem_type: "pollution_zones", created_date: "2026-01-01", resolved_date: "2026-01-10" },
    ]);
    expect(result[0].label).not.toBe(result[1].label);
    expect(result[0].avgDays).toBeGreaterThan(result[1].avgDays);
  });

  it("discards a negative resolution time (bad data) rather than skewing the average", () => {
    const result = buildResolutionTimeByCategory([
      { status: "completed", problem_type: "slum_watch", created_date: "2026-01-05", resolved_date: "2026-01-01" },
    ]);
    expect(result).toHaveLength(0);
  });

  it("returns an empty array when there are no resolved issues", () => {
    expect(buildResolutionTimeByCategory([{ status: "pending" }])).toEqual([]);
  });
});
