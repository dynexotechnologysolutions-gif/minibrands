import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/product",
        destination: "/products",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "velvet-lane",
  project: "velvet-lane-web",
  silent: true,
  widenClientFileUpload: true,
});
