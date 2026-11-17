import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal workspace packages ship TypeScript source.
  transpilePackages: ["@vaclendar/db", "@vaclendar/shared"],
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
