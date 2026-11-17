import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { runtimeDatabaseUrl } from "./env";

const globalForPrisma = globalThis as unknown as { __vaclendarPrisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: runtimeDatabaseUrl(),
    // Serverless functions each hold their own pool, so keep it small to stay
    // within the database's connection limit.
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

/**
 * Lazily created singleton. Reused across hot reloads in development (and
 * across invocations of a warm serverless instance) so we don't open a new
 * connection pool on every request.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.__vaclendarPrisma) {
    globalForPrisma.__vaclendarPrisma = createClient();
  }
  return globalForPrisma.__vaclendarPrisma;
}
