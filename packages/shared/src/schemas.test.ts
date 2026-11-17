import { describe, expect, it } from "vitest";
import {
  END_BEFORE_START_MESSAGE,
  createMemberSchema,
  createVacationSchema,
  updateMemberSchema,
  updateVacationSchema,
  vacationQuerySchema,
} from "./schemas";

const valid = {
  memberId: "m1",
  startDate: "2025-07-01",
  endDate: "2025-07-05",
  type: "VACATION",
  note: "Beach",
};

describe("createVacationSchema", () => {
  it("accepts a valid vacation", () => {
    expect(createVacationSchema.parse(valid)).toEqual(valid);
  });

  it("accepts a single-day vacation", () => {
    const result = createVacationSchema.safeParse({ ...valid, endDate: valid.startDate });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = createVacationSchema.safeParse({ ...valid, endDate: "2025-06-30" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endDate"],
      message: END_BEFORE_START_MESSAGE,
    });
  });

  it("rejects impossible calendar dates", () => {
    expect(createVacationSchema.safeParse({ ...valid, startDate: "2025-02-30" }).success).toBe(
      false,
    );
    expect(createVacationSchema.safeParse({ ...valid, startDate: "07/01/2025" }).success).toBe(
      false,
    );
  });

  it("rejects unknown types and missing members", () => {
    expect(createVacationSchema.safeParse({ ...valid, type: "HOLIDAY" }).success).toBe(false);
    expect(createVacationSchema.safeParse({ ...valid, memberId: "" }).success).toBe(false);
  });

  it("trims notes and allows them to be omitted or null", () => {
    expect(createVacationSchema.parse({ ...valid, note: "  hi  " }).note).toBe("hi");
    expect(createVacationSchema.safeParse({ ...valid, note: undefined }).success).toBe(true);
    expect(createVacationSchema.safeParse({ ...valid, note: null }).success).toBe(true);
    expect(createVacationSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("updateVacationSchema", () => {
  it("accepts a partial update", () => {
    expect(updateVacationSchema.parse({ type: "SICK" })).toEqual({ type: "SICK" });
  });

  it("rejects an empty update", () => {
    expect(updateVacationSchema.safeParse({}).success).toBe(false);
  });

  it("rejects end before start when both are given", () => {
    const result = updateVacationSchema.safeParse({
      startDate: "2025-07-10",
      endDate: "2025-07-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("vacationQuerySchema", () => {
  it("splits comma-separated filters", () => {
    expect(vacationQuerySchema.parse({ memberId: "a,b", type: "SICK,OTHER" })).toEqual({
      memberId: ["a", "b"],
      type: ["SICK", "OTHER"],
    });
  });

  it("accepts repeated params and empty values", () => {
    expect(vacationQuerySchema.parse({ memberId: ["a", "b"], type: "" })).toEqual({
      memberId: ["a", "b"],
      type: [],
    });
  });

  it("rejects an inverted range and unknown types", () => {
    expect(vacationQuerySchema.safeParse({ from: "2025-02-01", to: "2025-01-01" }).success).toBe(
      false,
    );
    expect(vacationQuerySchema.safeParse({ type: "NAP" }).success).toBe(false);
  });
});

describe("member schemas", () => {
  it("trims names and lowercases colors", () => {
    expect(createMemberSchema.parse({ name: "  Ada ", color: "#AABBCC" })).toEqual({
      name: "Ada",
      color: "#aabbcc",
    });
  });

  it("allows a member without a color", () => {
    expect(createMemberSchema.parse({ name: "Ada" })).toEqual({ name: "Ada" });
  });

  it("rejects blank names and bad colors", () => {
    expect(createMemberSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createMemberSchema.safeParse({ name: "Ada", color: "red" }).success).toBe(false);
  });

  it("requires at least one field on update", () => {
    expect(updateMemberSchema.safeParse({}).success).toBe(false);
    expect(updateMemberSchema.safeParse({ color: "#000000" }).success).toBe(true);
  });
});
