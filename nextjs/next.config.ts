import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // External packages for server components (updated syntax)
  serverExternalPackages: ['sharp'],
  // Image optimization settings for Docker
  images: {
    unoptimized: false,
  },
  // Temporarily disable ESLint during Docker builds to focus on containerization
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
