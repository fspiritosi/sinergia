import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["pino", "pino-pretty"],
  experimental: {
    // Las imágenes de inspección pesan hasta 15 MB (ver MAX_FILE_SIZE_MB); el
    // default de 1 MB del body de los Server Actions hacía fallar la subida
    // con un 500 ("Error al subir la imagen").
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
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
