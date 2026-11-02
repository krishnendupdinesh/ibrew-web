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

  // Sends every request that starts with /api to the Express backend (using 127.0.0.1 avoids Windows IPv6 localhost delay).
  async rewrites() {
    const backend = (process.env.BACKEND_URL || "http://127.0.0.1:5001").replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
