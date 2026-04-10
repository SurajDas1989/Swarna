import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "vrfebojxpyfrertujgye.supabase.co",
      },
      // Keep support for the placeholder mock image domains
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      }
    ],
    qualities: [75, 90],
  },
  // Security Headers — protects against XSS, clickjacking, MIME sniffing
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents clickjacking (embedding your site in an iframe)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevents MIME type sniffing attacks
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Controls referrer info leaking
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block", // Enables browser XSS filter
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Blocks access to device sensors
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Forces HTTPS for 2 years
          },
        ],
      },
    ];
  },
};

export default nextConfig;
