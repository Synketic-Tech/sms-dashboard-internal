import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // Keep the independent dashboard package separate from the PA-01 root package.
  turbopack: { root: process.cwd() },
};

export default config;
