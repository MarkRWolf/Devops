import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = process.env.DOTNET_API_BASE_URL
      ? process.env.DOTNET_API_BASE_URL.replace(/\/$/, "")
      : "";

    if (!backend) {
      console.warn("DOTNET_API_BASE_URL is not set; SignalR rewrites will be skipped");
    }

    return [
      {
        source: "/WS/:path*",
        destination: `${backend}/WS/:path*`,
      },
    ];
  },
};

export default nextConfig;
