import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      // Deezer image CDNs
      { protocol: "https", hostname: "**.dzcdn.net" },
      { protocol: "https", hostname: "api.deezer.com" },
    ],
  },
};

export default nextConfig;
