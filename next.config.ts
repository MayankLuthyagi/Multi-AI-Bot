import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for serverless deployment
  serverExternalPackages: [],
  outputFileTracingIncludes: {
    '/': ['./middleware.ts'],
  },
};

export default nextConfig;
