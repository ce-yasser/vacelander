export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Two inclusive whole-day ranges overlap when each one starts on or before
 * the other one ends. ISO YYYY-MM-DD strings compare correctly as strings.
 */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/** Returns the first range in `existing` that overlaps `candidate`, if any. */
export function findOverlap<T extends DateRange & { id: string }>(
  candidate: DateRange,
  existing: readonly T[],
  ignoreId?: string,
): T | undefined {
  return existing.find((range) => range.id !== ignoreId && rangesOverlap(candidate, range));
}
