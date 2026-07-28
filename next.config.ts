import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Job submission uploads a model file (STL/3MF/STEP) through a Server
      // Action — Next's default 1MB limit rejected almost any real model
      // file. Matches the job-files Storage bucket's own 100MB cap.
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
