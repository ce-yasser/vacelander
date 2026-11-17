import { describe, expect, it } from "vitest";
import { findOverlap, rangesOverlap } from "./overlap";

const r = (startDate: string, endDate: string) => ({ startDate, endDate });

describe("rangesOverlap", () => {
  it("detects partial overlaps in both directions", () => {
    expect(rangesOverlap(r("2025-07-01", "2025-07-05"), r("2025-07-04", "2025-07-10"))).toBe(true);
    expect(rangesOverlap(r("2025-07-04", "2025-07-10"), r("2025-07-01", "2025-07-05"))).toBe(true);
  });

  it("treats ranges as inclusive, so sharing one day is an overlap", () => {
    expect(rangesOverlap(r("2025-07-01", "2025-07-05"), r("2025-07-05", "2025-07-06"))).toBe(true);
    expect(rangesOverlap(r("2025-07-05", "2025-07-05"), r("2025-07-05", "2025-07-05"))).toBe(true);
  });

  it("detects containment", () => {
    expect(rangesOverlap(r("2025-07-01", "2025-07-31"), r("2025-07-10", "2025-07-12"))).toBe(true);
  });

  it("allows back-to-back ranges", () => {
    expect(rangesOverlap(r("2025-07-01", "2025-07-05"), r("2025-07-06", "2025-07-08"))).toBe(false);
  });

  it("works across month and year boundaries", () => {
    expect(rangesOverlap(r("2025-12-30", "2026-01-02"), r("2026-01-02", "2026-01-03"))).toBe(true);
    expect(rangesOverlap(r("2025-12-30", "2025-12-31"), r("2026-01-01", "2026-01-03"))).toBe(false);
  });
});

describe("findOverlap", () => {
  const existing = [
    { id: "a", ...r("2025-07-01", "2025-07-05") },
    { id: "b", ...r("2025-07-10", "2025-07-12") },
  ];

  it("returns the conflicting range", () => {
    expect(findOverlap(r("2025-07-11", "2025-07-15"), existing)?.id).toBe("b");
  });

  it("returns undefined when nothing overlaps", () => {
    expect(findOverlap(r("2025-07-06", "2025-07-09"), existing)).toBeUndefined();
  });

  it("ignores the range being edited", () => {
    expect(findOverlap(r("2025-07-02", "2025-07-03"), existing, "a")).toBeUndefined();
  });
});
