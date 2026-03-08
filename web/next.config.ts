import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts", // pdf.js tries to import canvas, we stub it out
    },
  },
};

export default nextConfig;
