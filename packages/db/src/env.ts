export const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/vaclendar";

export function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}
