/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  // Ensure trailing slashes for Firebase hosting compatibility
  trailingSlash: true,
};

export default nextConfig;
