import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Enables server rendering and API routes
  reactStrictMode: true,
};

export default nextConfig;
