import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // node_modules is in the parent directory, three levels up from this worktree
    root: path.resolve(__dirname, "../../.."),
  },
};

export default nextConfig;
