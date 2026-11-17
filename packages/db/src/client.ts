import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { databaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as { __vaclendarPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl() });
  return new PrismaClient({ adapter });
}

/**
 * Lazily created singleton. Reused across hot reloads in development so we
 * don't open a new connection pool on every change.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__vaclendarPrisma) {
    globalForPrisma.__vaclendarPrisma = createClient();
  }
  return globalForPrisma.__vaclendarPrisma;
}
