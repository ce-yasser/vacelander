import type { EventInput } from "@fullcalendar/core";
import {
  addDays,
  eachDay,
  readableTextColor,
  VACATION_TYPE_LABELS,
  type VacationWithMember,
} from "@vaclendar/shared";

/** Event title: the member's name, plus the type when it isn't a plain vacation. */
export function eventTitle(vacation: VacationWithMember): string {
  return vacation.type === "VACATION"
    ? vacation.member.name
    : `${vacation.member.name} · ${VACATION_TYPE_LABELS[vacation.type]}`;
}

/**
 * Maps a vacation to a FullCalendar all-day event. FullCalendar's all-day end
 * is exclusive, while our end dates are inclusive, hence the +1 day.
 */
export function toCalendarEvent(vacation: VacationWithMember): EventInput {
  return {
    id: vacation.id,
    title: eventTitle(vacation),
    start: vacation.startDate,
    end: addDays(vacation.endDate, 1),
    allDay: true,
    backgroundColor: vacation.member.color,
    borderColor: vacation.member.color,
    textColor: readableTextColor(vacation.member.color),
    classNames: [`vac-type-${vacation.type.toLowerCase().replace("_", "-")}`],
    extendedProps: { vacation },
  };
}

/** Converts a FullCalendar selection (exclusive end) to inclusive dates. */
export function selectionToRange(startStr: string, endStr: string) {
  const startDate = startStr.slice(0, 10);
  const endDate = addDays(endStr.slice(0, 10), -1);
  return { startDate, endDate: endDate < startDate ? startDate : endDate };
}

/** For each day, the distinct members who are off. */
export function peopleOffByDay(vacations: readonly VacationWithMember[]): Map<string, string[]> {
  const byDay = new Map<string, Set<string>>();
  for (const vacation of vacations) {
    for (const day of eachDay(vacation.startDate, vacation.endDate)) {
      let names = byDay.get(day);
      if (!names) byDay.set(day, (names = new Set()));
      names.add(vacation.member.name);
    }
  }
  return new Map([...byDay].map(([day, names]) => [day, [...names].sort()]));
}

/** YYYY-MM-DD for a Date in the browser's local timezone (as FullCalendar uses). */
export function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
