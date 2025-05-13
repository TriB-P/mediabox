/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['firebase', '@firebase/auth'],
  experimental: {
    forceSwcTransforms: false,
  },
  swcMinify: false,
  images: {
    domains: ['lh3.googleusercontent.com','storage.googleapis.com'], // Pour les avatars Google

  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Ignorer certains modules problématiques dans StackBlitz
    config.externals = [...(config.externals || []), 'undici'];

    return config;
  },
};

module.exports = nextConfig;
