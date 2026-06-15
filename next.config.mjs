/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
    ],
  },
  // Permettre les imports de modules Remotion (CommonJS)
  experimental: {
    serverComponentsExternalPackages: [
      "@remotion/renderer",
      "@remotion/bundler",
    ],
  },
};

export default nextConfig;
