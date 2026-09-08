/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  // Local-only: next-app lives inside the root xfree-platform repo,
  // which has its own package-lock.json - without this, local Turbopack
  // infers the parent directory as the workspace root (picking up that
  // sibling lockfile) and resolves pages relative to the wrong tree,
  // causing spurious "Cannot find module for page" build errors.
  //
  // Must NOT apply on Vercel: Vercel's own Root Directory setting
  // already treats next-app/ as the project root and re-roots file
  // tracing to the git checkout root (/vercel/path0) during its
  // packaging step. An explicit turbopack.root pointing at the
  // subdirectory conflicts with that re-rooting (known Turbopack/Vercel
  // path-doubling bug - vercel/next.js#88579) and breaks the build with
  // "ENOENT ... next-server.js.nft.json". Vercel sets VERCEL=1 during
  // both build and runtime, so this only ever activates locally.
  ...(process.env.VERCEL
    ? {}
    : {
        turbopack: {
          root: __dirname,
        },
      }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
