import { describe, expect, it } from "vitest";
import {
  addDays,
  eachDay,
  inclusiveDayCount,
  isIsoDate,
  isoDateToUtc,
  utcToIsoDate,
} from "./dates";
import { MEMBER_COLOR_PALETTE, pickMemberColor, readableTextColor } from "./colors";

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("2025-1-01")).toBe(false);
  });

  it("round-trips through UTC without shifting", () => {
    expect(utcToIsoDate(isoDateToUtc("2025-03-30"))).toBe("2025-03-30");
  });

  it("adds days across boundaries", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2025-03-01", -1)).toBe("2025-02-28");
  });

  it("counts and lists inclusive days", () => {
    expect(inclusiveDayCount("2025-07-01", "2025-07-01")).toBe(1);
    expect(inclusiveDayCount("2025-07-01", "2025-07-05")).toBe(5);
    expect(eachDay("2025-07-30", "2025-08-01")).toEqual(["2025-07-30", "2025-07-31", "2025-08-01"]);
  });
});

describe("colors", () => {
  it("picks the first unused palette color", () => {
    expect(pickMemberColor([])).toBe(MEMBER_COLOR_PALETTE[0]);
    expect(pickMemberColor([MEMBER_COLOR_PALETTE[0].toUpperCase()])).toBe(MEMBER_COLOR_PALETTE[1]);
  });

  it("still returns a palette color when all are taken", () => {
    expect(MEMBER_COLOR_PALETTE).toContain(pickMemberColor([...MEMBER_COLOR_PALETTE]));
  });

  it("chooses readable text colors", () => {
    expect(readableTextColor("#ffffff")).toBe("#000000");
    expect(readableTextColor("#1e3a8a")).toBe("#ffffff");
  });
});
