import { getPrisma } from "@vaclendar/db";
import { createPrismaRepo } from "./prisma-repo";
import type { Repo } from "./repo";

let repo: Repo | undefined;

/** The repository used by route handlers. Backed by Prisma unless overridden. */
export function getRepo(): Repo {
  if (!repo) {
    const prisma = getPrisma();
    repo = createPrismaRepo(prisma, prisma);
  }
  return repo;
}

/** Swaps the repository (used by tests). Pass `undefined` to reset. */
export function setRepo(next: Repo | undefined): void {
  repo = next;
}
