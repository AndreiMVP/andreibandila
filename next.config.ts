import type { NextConfig } from "next";

function supabaseImageHost() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  transpilePackages: ["@andreibandila/shared"],
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/photos/**" }]
      : [],
  },
  async redirects() {
    return [
      { source: "/albume", destination: "/foto", permanent: true },
      { source: "/albume/:path*", destination: "/foto/:path*", permanent: true },
      { source: "/filme", destination: "/film", permanent: true },
      { source: "/filme/:path*", destination: "/film/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
