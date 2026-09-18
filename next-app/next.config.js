/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  // Don't advertise the framework to every visitor/scanner via the
  // X-Powered-By response header.
  poweredByHeader: false,
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
  // No page currently renders a remote image via next/image (verified by
  // grep across app/, components/, lib/ - zero matches) - the previous
  // `hostname: '**'` wildcard allowlisted every possible remote host for
  // a feature that isn't used, which is real attack surface (SSRF-via-
  // image-optimizer-proxy is a known Next.js footgun) for no benefit. Add
  // real entries here if/when a remote image source is actually wired up.
  images: {
    remotePatterns: [],
  },
  // Moved from vercel.json's `redirects` array: Vercel-level redirects
  // only take effect on an actual Vercel deployment (or `vercel dev`), not
  // under a plain `next build && next start` - which meant this had no way
  // to be covered by a Playwright test. Next's own redirects() produces the
  // identical behavior once deployed (Vercel understands it natively) and
  // also works locally, so it's both the more testable and more portable
  // choice for something that lives inside this app rather than at the
  // platform/infra layer.
  async redirects() {
    // Legacy tool URLs Search Console still lists as 404 (from an older,
    // larger tool catalog, crawled Aug 2026), redirected ONLY where a real
    // tool today has the same intent. Everything else from that set stays a
    // genuine 404 - redirecting unrelated pages to a random tool would just
    // read as a soft 404 to Google.
    const legacyToolRedirects = {
      'url-decoder': 'url-decode',
      'whois-lookup-free': 'whois-lookup',
      'sha256-generator': 'sha256-hash',
      'sql-beautifier': 'sql-formatter',
      'ai-regex-explainer': 'regex-explainer',
      'regex-generator-ai': 'regex-builder',
    };
    return [
      {
        source: '/studio',
        destination: 'https://app.xfree.in/',
        permanent: true,
      },
      ...Object.entries(legacyToolRedirects).map(([from, to]) => ({
        source: `/tools/${from}`,
        destination: `/tools/${to}`,
        permanent: true,
      })),
    ];
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
              // 'unsafe-eval' removed - nothing in this app's production
              // bundle (Turbopack output, no eval-based devtool, no
              // template-string code execution) needs it; only dev-mode
              // tooling ever wants it, and this headers() block applies
              // to the deployed build. 'unsafe-inline' stays for now:
              // removing it needs per-request nonces threaded through
              // proxy.ts (this app's next-intl locale-routing middleware,
              // Next 16 renamed middleware.ts to proxy.ts - see AGENTS.md)
              // and every dangerouslySetInnerHTML call site (JSON-LD in
              // layout.tsx, tools/pillars pages, Breadcrumbs). That's a
              // real, well-scoped follow-up (tracked in
              // docs/SECURITY_MODEL.md) but touches the one file that
              // currently makes locale routing across all 10 locales
              // work - not something to change opportunistically inside
              // an unrelated headers hardening pass.
              "script-src 'self' 'unsafe-inline'",
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
