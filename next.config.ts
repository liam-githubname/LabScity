import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/**`),
    ],
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  }
};

export default nextConfig;
