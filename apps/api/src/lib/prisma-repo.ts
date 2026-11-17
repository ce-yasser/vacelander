import { Prisma, type PrismaClient } from "@vaclendar/db";
import { isoDateToUtc, utcToIsoDate, type Member, type Vacation } from "@vaclendar/shared";
import type { Repo, VacationData } from "./repo";

type Db = PrismaClient | Prisma.TransactionClient;

const memberSelect = { id: true, name: true, color: true } as const;

type MemberRow = { id: string; name: string; color: string; createdAt: Date };
type VacationRow = Omit<Vacation, "startDate" | "endDate" | "createdAt" | "updatedAt"> & {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

const toMember = (m: MemberRow): Member => ({ ...m, createdAt: m.createdAt.toISOString() });

function toVacation<T extends VacationRow>(v: T) {
  return {
    ...v,
    startDate: utcToIsoDate(v.startDate),
    endDate: utcToIsoDate(v.endDate),
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

function toVacationInput(data: Partial<VacationData>) {
  return {
    ...data,
    ...(data.startDate !== undefined ? { startDate: isoDateToUtc(data.startDate) } : {}),
    ...(data.endDate !== undefined ? { endDate: isoDateToUtc(data.endDate) } : {}),
  };
}

export function createPrismaRepo(db: Db, root?: PrismaClient): Repo {
  const repo: Repo = {
    async transaction(fn) {
      // Already inside a transaction: reuse it.
      if (!root) return fn(repo);
      return root.$transaction((tx) => fn(createPrismaRepo(tx)), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    },

    async listMembers() {
      const rows = await db.member.findMany({ orderBy: { name: "asc" } });
      return rows.map(toMember);
    },

    async getMember(id) {
      const row = await db.member.findUnique({ where: { id } });
      return row ? toMember(row) : null;
    },

    async findMemberByName(name) {
      const row = await db.member.findFirst({
        where: { name: { equals: name, mode: "insensitive" } },
      });
      return row ? toMember(row) : null;
    },

    async createMember(data) {
      return toMember(await db.member.create({ data }));
    },

    async updateMember(id, data) {
      return toMember(await db.member.update({ where: { id }, data }));
    },

    async deleteMember(id) {
      await db.member.delete({ where: { id } });
    },

    async listVacations({ from, to, memberIds, types }) {
      const rows = await db.vacation.findMany({
        where: {
          ...(to ? { startDate: { lte: isoDateToUtc(to) } } : {}),
          ...(from ? { endDate: { gte: isoDateToUtc(from) } } : {}),
          ...(memberIds?.length ? { memberId: { in: memberIds } } : {}),
          ...(types?.length ? { type: { in: types } } : {}),
        },
        include: { member: { select: memberSelect } },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      });
      return rows.map(toVacation);
    },

    async getVacation(id) {
      const row = await db.vacation.findUnique({ where: { id } });
      return row ? toVacation(row) : null;
    },

    async findOverlappingVacation(memberId, startDate, endDate, excludeId) {
      const row = await db.vacation.findFirst({
        where: {
          memberId,
          startDate: { lte: isoDateToUtc(endDate) },
          endDate: { gte: isoDateToUtc(startDate) },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        orderBy: { startDate: "asc" },
      });
      return row ? toVacation(row) : null;
    },

    async createVacation(data) {
      const row = await db.vacation.create({
        data: toVacationInput(data) as Prisma.VacationUncheckedCreateInput,
        include: { member: { select: memberSelect } },
      });
      return toVacation(row);
    },

    async updateVacation(id, data) {
      const row = await db.vacation.update({
        where: { id },
        data: toVacationInput(data),
        include: { member: { select: memberSelect } },
      });
      return toVacation(row);
    },

    async deleteVacation(id) {
      await db.vacation.delete({ where: { id } });
    },
  };
  return repo;
}
