import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The in-app browser may address the dev server as 127.0.0.1 while
  // Next.js is started on localhost. Allow the loopback origin for HMR.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
