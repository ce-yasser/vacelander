import { findOverlap, type Member, type Vacation } from "@vaclendar/shared";
import type { Repo, VacationData } from "@/lib/repo";

/** In-memory Repo used by API tests, so they run without a database. */
export function createMemoryRepo() {
  const members = new Map<string, Member>();
  const vacations = new Map<string, Vacation>();
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${++seq}`;
  const now = () => new Date(Date.UTC(2025, 0, 1, 0, 0, seq)).toISOString();

  const withMember = (v: Vacation) => {
    const m = members.get(v.memberId)!;
    return { ...v, member: { id: m.id, name: m.name, color: m.color } };
  };

  const repo: Repo = {
    transaction: (fn) => fn(repo),

    async listMembers() {
      return [...members.values()].sort((a, b) => a.name.localeCompare(b.name));
    },
    async getMember(id) {
      return members.get(id) ?? null;
    },
    async findMemberByName(name) {
      const lower = name.toLowerCase();
      return [...members.values()].find((m) => m.name.toLowerCase() === lower) ?? null;
    },
    async createMember(data) {
      const member = { id: nextId("mem"), createdAt: now(), ...data };
      members.set(member.id, member);
      return member;
    },
    async updateMember(id, data) {
      const member = { ...members.get(id)!, ...data };
      members.set(id, member);
      return member;
    },
    async deleteMember(id) {
      members.delete(id);
      for (const v of vacations.values()) if (v.memberId === id) vacations.delete(v.id);
    },

    async listVacations({ from, to, memberIds, types }) {
      return [...vacations.values()]
        .filter((v) => (!to || v.startDate <= to) && (!from || v.endDate >= from))
        .filter((v) => !memberIds?.length || memberIds.includes(v.memberId))
        .filter((v) => !types?.length || types.includes(v.type))
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map(withMember);
    },
    async getVacation(id) {
      return vacations.get(id) ?? null;
    },
    async findOverlappingVacation(memberId, startDate, endDate, excludeId) {
      const own = [...vacations.values()].filter((v) => v.memberId === memberId);
      return findOverlap({ startDate, endDate }, own, excludeId) ?? null;
    },
    async createVacation(data: VacationData) {
      const stamp = now();
      const vacation = { id: nextId("vac"), createdAt: stamp, updatedAt: stamp, ...data };
      vacations.set(vacation.id, vacation);
      return withMember(vacation);
    },
    async updateVacation(id, data) {
      const vacation = { ...vacations.get(id)!, ...data, updatedAt: now() };
      vacations.set(id, vacation);
      return withMember(vacation);
    },
    async deleteVacation(id) {
      vacations.delete(id);
    },
  };

  return { repo, members, vacations };
}
