import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server's hot-reload connection work when testing on a
  // phone over the LAN (e.g. http://192.168.x.x:3000) instead of
  // localhost. Dev-only — irrelevant once deployed. Update this if your
  // machine's LAN IP changes.
  allowedDevOrigins: ["192.168.4.26", "192.168.4.117"],
};

export default nextConfig;
