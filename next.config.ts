import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true, // Enable source maps in production
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kcoddkknlthcxktjhzeb.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
