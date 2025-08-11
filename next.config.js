// Fichier: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour l'export statique Firebase
  output: 'export',
  trailingSlash: true,
  
  // Tes configurations existantes
  transpilePackages: ['firebase', '@firebase/auth'],
  experimental: {
    forceSwcTransforms: false,
  },
  swcMinify: false,
  
  // Configuration images mise à jour pour l'export statique
  images: {
    domains: ['lh3.googleusercontent.com','storage.googleapis.com'], // Pour les avatars Google
    unoptimized: true // Nécessaire pour l'export statique
  },
  
  // Tes configurations webpack existantes
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