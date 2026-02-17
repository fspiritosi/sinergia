import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['pino', 'pino-pretty'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-f585ac1b3c1f462c8439adaf03fa21cd.r2.dev",
      },
    ],
  },
};

export default nextConfig;
