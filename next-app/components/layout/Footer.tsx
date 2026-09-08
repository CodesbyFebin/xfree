import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';

const FOOTER_TOOLS = TOOLS.slice(0, 6);

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="border-t border-cyber-border bg-cyber-surface py-14 px-4" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
          <section aria-labelledby="footer-brand">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="XFree homepage">
              {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size logo, see Header.tsx */}
              <picture className="shrink-0">
                <source srcSet="/logo-wordmark-80.webp 1x, /logo-wordmark-160.webp 2x" type="image/webp" />
                <img
                  src="/logo-wordmark-80.png"
                  srcSet="/logo-wordmark-80.png 1x, /logo-wordmark-160.png 2x"
                  alt="XFree"
                  width={160}
                  height={80}
                  decoding="async"
                  style={{ height: '40px', width: '80px' }}
                />
              </picture>
              <span id="footer-brand" className="sr-only">XFree.in</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-cyber-muted">
              {t('tagline')}
            </p>

            <Link
              href="https://app.xfree.in/"
              className="mt-6 cyber-btn cyber-btn-filled text-sm px-5 py-3 rounded inline-flex items-center gap-2"
              rel="noopener"
            >
              <span>{t('openStudio')}</span>
              <span aria-hidden="true">→</span>
            </Link>

            <p className="mt-4 text-xs leading-5 text-cyber-dim font-mono">
              {t('availableStats', { tools: TOOLS.length, pillars: PILLARS.length })}
            </p>
          </section>

          <nav aria-label="XFree footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-6">
            <section aria-labelledby="footer-categories">
              <h2 id="footer-categories" className="text-sm font-semibold text-cyber-glow font-mono">
                {t('categoriesHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/categories/developer-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('developerTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/categories/seo-url-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('seoTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/categories/ai-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('aiTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/categories/security-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('securityTools')}
                  </Link>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-popular">
              <h2 id="footer-popular" className="text-sm font-semibold text-cyber-cyan font-mono">
                {t('popularHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_TOOLS.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="text-sm text-cyber-muted transition-colors hover:text-cyber-text"
                    >
                      XFree {tool.title.replace('XFree ', '')}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-pillars">
              <h2 id="footer-pillars" className="text-sm font-semibold text-cyber-magenta font-mono">
                {t('toolHubsHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/pillars/json-data-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('jsonDataTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/regex-pattern-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('regexTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/encoding-conversion-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('encodingTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/hash-generator-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('hashTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/password-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('securityTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/generator-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('generatorTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/seo-audit-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('seoTools')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/dns-lookup-tools" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('networkTools')}
                  </Link>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-resources">
              <h2 id="footer-resources" className="text-sm font-semibold text-cyber-amber font-mono">
                {t('resourcesHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/updates" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('signals')}
                  </Link>
                </li>
                <li>
                  <Link href="/pillars" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('pillarHubs')}
                  </Link>
                </li>
                <li>
                  {/* Not locale-prefixed: lives at app root, not under app/[locale]/ */}
                  <NextLink href="/sitemap.xml" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('xmlSitemap')}
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/robots.txt" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('robotsTxt')}
                  </NextLink>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="text-sm font-semibold text-cyber-text font-mono">
                {t('companyHeading')}
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/about" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('about')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-cyber-muted transition-colors hover:text-cyber-text">
                    {t('terms')}
                  </Link>
                </li>
              </ul>
            </section>
          </nav>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-cyber-glow/30 to-transparent my-6" />

        <div className="flex flex-col gap-4 border-t border-cyber-border pt-6 text-xs text-cyber-dim sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="font-mono">
            {t('marketing')}: <a href="https://www.xfree.in/" className="text-cyber-muted hover:text-cyber-text">www.xfree.in</a> · {t('application')}:{' '}
            <a href="https://app.xfree.in/" className="text-cyber-muted hover:text-cyber-text" rel="noopener">
              app.xfree.in
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
