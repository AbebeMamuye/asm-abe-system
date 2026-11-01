/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ensure CSS modules are processed
    return config;
  },
};

module.exports = nextConfig;
