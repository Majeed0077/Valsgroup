// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/maptrack',
        destination: 'http://203.215.168.43:4051/maptrack',
      },
    ];
  },
};

export default nextConfig;