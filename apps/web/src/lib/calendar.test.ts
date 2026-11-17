import { describe, expect, it } from "vitest";
import type { VacationWithMember } from "@vaclendar/shared";
import { peopleOffByDay, selectionToRange, toCalendarEvent } from "./calendar";
import { vacationSearchParams } from "./api";

const vacation = (overrides: Partial<VacationWithMember> = {}): VacationWithMember => ({
  id: "v1",
  memberId: "m1",
  startDate: "2025-07-01",
  endDate: "2025-07-03",
  type: "VACATION",
  note: null,
  createdAt: "",
  updatedAt: "",
  member: { id: "m1", name: "Ada", color: "#2563eb" },
  ...overrides,
});

describe("toCalendarEvent", () => {
  it("makes an all-day event with an exclusive end and the member color", () => {
    expect(toCalendarEvent(vacation())).toMatchObject({
      title: "Ada",
      start: "2025-07-01",
      end: "2025-07-04",
      allDay: true,
      backgroundColor: "#2563eb",
      textColor: "#ffffff",
    });
  });

  it("adds the type to the title for non-vacation types", () => {
    expect(toCalendarEvent(vacation({ type: "PUBLIC_HOLIDAY" })).title).toBe(
      "Ada · Public Holiday",
    );
  });
});

describe("selectionToRange", () => {
  it("converts FullCalendar's exclusive end to an inclusive end", () => {
    expect(selectionToRange("2025-07-01", "2025-07-02")).toEqual({
      startDate: "2025-07-01",
      endDate: "2025-07-01",
    });
    expect(selectionToRange("2025-07-30", "2025-08-02")).toEqual({
      startDate: "2025-07-30",
      endDate: "2025-08-01",
    });
  });
});

describe("peopleOffByDay", () => {
  it("counts distinct members per day", () => {
    const byDay = peopleOffByDay([
      vacation(),
      vacation({
        id: "v2",
        startDate: "2025-07-03",
        endDate: "2025-07-04",
        memberId: "m2",
        member: { id: "m2", name: "Grace", color: "#000000" },
      }),
    ]);
    expect(byDay.get("2025-07-01")).toEqual(["Ada"]);
    expect(byDay.get("2025-07-03")).toEqual(["Ada", "Grace"]);
    expect(byDay.get("2025-07-05")).toBeUndefined();
  });
});

describe("vacationSearchParams", () => {
  it("builds a query string from filters", () => {
    expect(vacationSearchParams({})).toBe("");
    expect(
      vacationSearchParams({
        from: "2025-07-01",
        to: "2025-07-31",
        memberIds: ["a", "b"],
        types: ["SICK"],
      }),
    ).toBe("?from=2025-07-01&to=2025-07-31&memberId=a%2Cb&type=SICK");
  });
});
