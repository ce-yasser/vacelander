/**
 * Vacation dates are whole calendar days, represented everywhere as
 * ISO "YYYY-MM-DD" strings. All arithmetic is done in UTC so the local
 * timezone can never shift a day.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a real calendar date in YYYY-MM-DD form. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Converts a YYYY-MM-DD string to a Date at UTC midnight. */
export function isoDateToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Converts a Date to YYYY-MM-DD using its UTC calendar day. */
export function utcToIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Adds (or subtracts) whole days to a YYYY-MM-DD string. */
export function addDays(value: string, days: number): string {
  const date = isoDateToUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToIsoDate(date);
}

/** Number of days in an inclusive range, e.g. 2025-01-01..2025-01-01 is 1. */
export function inclusiveDayCount(startDate: string, endDate: string): number {
  const ms = isoDateToUtc(endDate).getTime() - isoDateToUtc(startDate).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Every YYYY-MM-DD day in an inclusive range. */
export function eachDay(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  for (let day = startDate; day <= endDate; day = addDays(day, 1)) days.push(day);
  return days;
}

/** Today's date in the local timezone, as YYYY-MM-DD. */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
