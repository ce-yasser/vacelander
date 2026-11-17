export const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/vaclendar";

/**
 * Direct connection. Used by the Prisma CLI (migrations need a direct,
 * session-level connection) and as the runtime fallback.
 */
export function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

/**
 * Connection used by the app at runtime. On Vercel, the Prisma Postgres
 * integration provides a pooled URL that copes better with many short-lived
 * serverless instances; locally this falls back to DATABASE_URL.
 */
export function runtimeDatabaseUrl(): string {
  return process.env.DATABASE_URL_POOLED || databaseUrl();
}
