import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  allowedDevOrigins: ["1.230.230.201"],
};

export default nextConfig;

// module.exports = {};
