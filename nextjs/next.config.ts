import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel deployment - use serverless functions (no standalone output)
  // External packages for server components
  serverExternalPackages: ['sharp'],
  
  // Image optimization settings (Vercel handles this automatically)
  images: {
    unoptimized: false,
    domains: ['hcyteovnllklmvoptxjr.supabase.co'], // Add Supabase domain for images
  },
  
  // Enable ESLint for Vercel builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

export default nextConfig;
