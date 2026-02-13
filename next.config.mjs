// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // Reduce client bundle impact for icon libraries
  experimental: {
    optimizePackageImports: ["react-icons"],
  },

  // General production defaults
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
