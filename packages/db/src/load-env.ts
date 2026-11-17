import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/**
 * Loads packages/db/.env (if present) for the Prisma CLI and the seed script.
 * Not used at runtime: the API app loads its own .env through Next.js.
 */
export function loadDbEnv(): void {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (existsSync(envPath)) config({ path: envPath, quiet: true });
}
