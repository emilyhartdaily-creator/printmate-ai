/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'aftcnnjoaoroafskesus.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
