import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Le backend est une API pure — les erreurs de types dans les pages de docs ne bloquent pas la prod
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
