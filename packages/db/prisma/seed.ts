import { addDays, isoDateToUtc, todayLocal, type VacationType } from "@vaclendar/shared";
import { getPrisma } from "../src/client";
import { loadDbEnv } from "../src/load-env";

loadDbEnv();

const members = [
  { name: "Alice Johnson", color: "#2563eb" },
  { name: "Bilal Ahmed", color: "#dc2626" },
  { name: "Chen Wei", color: "#16a34a" },
  { name: "Dana Lopez", color: "#d97706" },
  { name: "Emeka Obi", color: "#9333ea" },
];

/**
 * [memberIndex, startOffset, length, type, note]. Offsets count days from the
 * first of the current month, so the data always lands in the current and
 * next month. Several ranges intentionally share days to show the
 * "people off" badge, but no member has overlapping vacations.
 */
const plan: [number, number, number, VacationType, string | null][] = [
  [0, 2, 5, "VACATION", "Family trip"],
  [0, 20, 2, "SICK", null],
  [0, 38, 7, "VACATION", "Hiking in the Alps"],
  [1, 4, 3, "VACATION", "Long weekend"],
  [1, 24, 1, "OTHER", "Moving house"],
  [1, 45, 4, "VACATION", null],
  [2, 5, 2, "SICK", "Flu"],
  [2, 14, 1, "PUBLIC_HOLIDAY", "National day"],
  [2, 33, 10, "VACATION", "Visiting family"],
  [3, 10, 5, "VACATION", "Beach week"],
  [3, 25, 1, "PUBLIC_HOLIDAY", null],
  [3, 40, 3, "OTHER", "Conference"],
  [4, 11, 3, "VACATION", "City break"],
  [4, 30, 1, "SICK", null],
  [4, 41, 5, "VACATION", "Road trip"],
];

async function main() {
  const prisma = getPrisma();
  const monthStart = `${todayLocal().slice(0, 7)}-01`;

  await prisma.vacation.deleteMany();
  await prisma.member.deleteMany();

  const created: { id: string }[] = [];
  for (const member of members) {
    created.push(await prisma.member.create({ data: member }));
  }

  await prisma.vacation.createMany({
    data: plan.map(([memberIndex, offset, length, type, note]) => {
      const startDate = addDays(monthStart, offset);
      return {
        memberId: created[memberIndex]!.id,
        startDate: isoDateToUtc(startDate),
        endDate: isoDateToUtc(addDays(startDate, length - 1)),
        type,
        note,
      };
    }),
  });

  console.log(`Seeded ${created.length} members and ${plan.length} vacations.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await getPrisma().$disconnect();
  process.exit(1);
});
