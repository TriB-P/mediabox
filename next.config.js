// Fichier: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration conditionnelle selon l'environnement
  // Utilise 'export' seulement pour le build Firebase
  ...(process.env.FIREBASE_BUILD === 'true' && {
    output: 'export',
    trailingSlash: true,
  }),
  
  // Tes configurations existantes (toujours actives)
  transpilePackages: ['firebase', '@firebase/auth'],
  experimental: {
    forceSwcTransforms: false,
  },
  swcMinify: false,
  
  // Configuration images conditionnelle
  images: {
    domains: ['lh3.googleusercontent.com','storage.googleapis.com'], // Pour les avatars Google
    // 'unoptimized: true' seulement pour l'export statique Firebase
    ...(process.env.FIREBASE_BUILD === 'true' && {
      unoptimized: true
    })
  },
  
  // Tes configurations webpack existantes (toujours actives)
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

