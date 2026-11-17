import {
  END_BEFORE_START_MESSAGE,
  type CreateVacationInput,
  type UpdateVacationInput,
  type Vacation,
  type VacationQuery,
  type VacationWithMember,
} from "@vaclendar/shared";
import { conflict, notFound, validationError } from "@/lib/errors";
import type { Repo, VacationData } from "@/lib/repo";

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function overlapError(memberName: string, existing: Vacation) {
  const range =
    existing.startDate === existing.endDate
      ? `on ${formatDay(existing.startDate)}`
      : `from ${formatDay(existing.startDate)} to ${formatDay(existing.endDate)}`;
  return conflict(`${memberName} already has time off ${range}, which overlaps these dates`);
}

const normalizeNote = (note: string | null | undefined) => (note ? note : null);

export function listVacations(repo: Repo, query: VacationQuery): Promise<VacationWithMember[]> {
  return repo.listVacations({
    from: query.from,
    to: query.to,
    memberIds: query.memberId,
    types: query.type,
  });
}

export function createVacation(
  repo: Repo,
  input: CreateVacationInput,
): Promise<VacationWithMember> {
  return repo.transaction(async (tx) => {
    const member = await tx.getMember(input.memberId);
    if (!member) throw notFound("Team member not found");

    const overlap = await tx.findOverlappingVacation(member.id, input.startDate, input.endDate);
    if (overlap) throw overlapError(member.name, overlap);

    return tx.createVacation({ ...input, note: normalizeNote(input.note) });
  });
}

export function updateVacation(
  repo: Repo,
  id: string,
  input: UpdateVacationInput,
): Promise<VacationWithMember> {
  return repo.transaction(async (tx) => {
    const existing = await tx.getVacation(id);
    if (!existing) throw notFound("Vacation not found");

    const changes: Partial<VacationData> = { ...input };
    if ("note" in input) changes.note = normalizeNote(input.note);
    else delete changes.note;

    const next = { ...existing, ...changes };
    if (next.endDate < next.startDate) {
      throw validationError(END_BEFORE_START_MESSAGE, [
        { path: "endDate", message: END_BEFORE_START_MESSAGE },
      ]);
    }

    const member = await tx.getMember(next.memberId);
    if (!member) throw notFound("Team member not found");

    const overlap = await tx.findOverlappingVacation(member.id, next.startDate, next.endDate, id);
    if (overlap) throw overlapError(member.name, overlap);

    return tx.updateVacation(id, changes);
  });
}

export async function deleteVacation(repo: Repo, id: string): Promise<void> {
  await repo.transaction(async (tx) => {
    if (!(await tx.getVacation(id))) throw notFound("Vacation not found");
    await tx.deleteVacation(id);
  });
}
