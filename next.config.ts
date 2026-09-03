import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cover images come from many third-party feeds (press, Devpost, Eventbrite,
    // company blogs). Allow any HTTPS host and skip the optimizer so a broken or
    // slow remote image never blocks a render — the <Cover> component falls back
    // to a gradient on error.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
