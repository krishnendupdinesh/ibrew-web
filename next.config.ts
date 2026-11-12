import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
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
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "static.toiimg.com",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
    ],
  },

  // Sends every request that starts with /api to the Express backend
  async rewrites() {
    const isProduction =
      process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    const fallback = isProduction
      ? "https://ibrew-backend.onrender.com"
      : "http://localhost:5001";
    const backend = (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      fallback
    ).replace(/\/+$/, "");


    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
