import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The in-app browser may address the dev server as 127.0.0.1 while
  // Next.js is started on localhost. Allow the loopback origin for HMR.
  allowedDevOrigins: ["127.0.0.1"],
  // Local storage is a persistent runtime volume, not a deploy artifact.
  // Exclude it from the health route's NFT trace so dynamic filesystem access
  // cannot pull the whole repository into the production trace.
  outputFileTracingExcludes: {
    "/api/health/ready": [
      "./storage/**/*",
      "./.radarune-private/**/*",
      "./.radarune-backups/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/sitemaps/static.xml", destination: "/sitemaps/static" },
      { source: "/sitemaps/artists.xml", destination: "/sitemaps/artists" },
      { source: "/sitemaps/smart-links.xml", destination: "/sitemaps/smart-links" },
      { source: "/sitemaps/playlists.xml", destination: "/sitemaps/playlists" },
      { source: "/sitemaps/presaves.xml", destination: "/sitemaps/presaves" },
    ];
  },
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
