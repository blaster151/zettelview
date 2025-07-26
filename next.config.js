/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 13+
  // Enable static exports for deployment
  output: 'export',
  trailingSlash: true,
  // Handle CRA-specific files
  webpack: (config, { isServer }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Handle CRA environment variables
    config.plugins.push(
      new (require('webpack')).DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      })
    );
    
    return config;
  },
  // Handle CRA routing
  async rewrites() {
    return [
      {
        source: '/static/:path*',
        destination: '/_next/static/:path*',
      },
    ];
  },
}

module.exports = nextConfig 