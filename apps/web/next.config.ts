import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Internal workspace packages ship TypeScript source.
  transpilePackages: ["@vaclendar/shared", "@vaclendar/ui"],
};

export default nextConfig;
