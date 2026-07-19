import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (its own minimal node_modules)
  // instead of requiring the full node_modules tree at runtime -- keeps the Docker
  // image small and the container fast to start. No effect on `next dev`.
  output: "standalone",
};

export default nextConfig;
