import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, machine-readable discovery files, Next internals,
  // and static assets — none of those are locale-specific.
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*|llms\\.txt|llms-full\\.txt|ai\\.txt|robots\\.txt|sitemap.*\\.xml|capabilities\\.json|tools\\.json|workflows\\.json|rss|opengraph-image|twitter-image).*)',
  ],
};
