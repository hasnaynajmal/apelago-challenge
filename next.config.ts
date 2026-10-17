import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: { position: "bottom-right" },
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
  // Old routes from before the dashboard existed.
  async redirects() {
    return [
      { source: "/startups/:id", destination: "/dashboard/startups/:id", permanent: false },
      { source: "/runs/:runId", destination: "/dashboard/runs/:runId", permanent: false },
      { source: "/intake", destination: "/dashboard/assess", permanent: false },
    ];
  },
};

export default nextConfig;
