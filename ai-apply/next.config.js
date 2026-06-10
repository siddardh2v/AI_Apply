/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enables src/instrumentation.ts (the live job-refresh loop) on Next 14.
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
