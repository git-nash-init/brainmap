import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/app", destination: "/app/index.html" }];
  },
  async headers() {
    return [
      // lets the service worker in /app/ control the page served at /app
      { source: "/app/sw.js", headers: [{ key: "Service-Worker-Allowed", value: "/app" }, { key: "Cache-Control", value: "no-cache" }] },
      { source: "/app/:path*", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
