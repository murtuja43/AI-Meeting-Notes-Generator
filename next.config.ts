import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow <Image> (and general remote loading) from Cloudinary-hosted assets.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // The audio-processing route streams files; give server actions/uploads
  // a generous body size ceiling so larger meeting recordings are accepted.
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
