import type { Member, Vacation, VacationType, VacationWithMember } from "@vaclendar/shared";

export interface VacationFilter {
  from?: string;
  to?: string;
  memberIds?: string[];
  types?: VacationType[];
}

export interface VacationData {
  memberId: string;
  startDate: string;
  endDate: string;
  type: VacationType;
  note: string | null;
}

/**
 * Persistence boundary for the API. Dates are YYYY-MM-DD strings on both
 * sides, so services never deal with Date objects or timezones.
 */
export interface Repo {
  /** Runs `fn` atomically. Overlap checks and writes happen inside one. */
  transaction<T>(fn: (repo: Repo) => Promise<T>): Promise<T>;

  listMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | null>;
  /** Case-insensitive lookup. */
  findMemberByName(name: string): Promise<Member | null>;
  createMember(data: { name: string; color: string }): Promise<Member>;
  updateMember(id: string, data: { name?: string; color?: string }): Promise<Member>;
  /** Also deletes the member's vacations. */
  deleteMember(id: string): Promise<void>;

  listVacations(filter: VacationFilter): Promise<VacationWithMember[]>;
  getVacation(id: string): Promise<Vacation | null>;
  findOverlappingVacation(
    memberId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<Vacation | null>;
  createVacation(data: VacationData): Promise<VacationWithMember>;
  updateVacation(id: string, data: Partial<VacationData>): Promise<VacationWithMember>;
  deleteVacation(id: string): Promise<void>;
}
