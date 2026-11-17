import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/env";
import { loadDbEnv } from "./src/load-env";

loadDbEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl(),
  },
});
