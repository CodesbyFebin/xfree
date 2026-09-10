import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';

interface FooterStats {
  tools: number;
  pillars: number;
  signupRate: number;
}

export function Footer() {
  const t = useTranslations('Footer');
  const toolsCount = TOOLS.length;
  const pillarsCount = PILLARS.length;

  const footerStats: FooterStats = {
    tools: toolsCount,
    pillars: pillarsCount,
    signupRate: 0
  };

  return (
    <footer 
      className="relative border-t border-cyber-border bg-cyber-surface py-16 px-4 overflow-hidden"
      role="contentinfo"
    >
      {/* Background */}
      <picture>
        <source 
          srcSet="/footer-skyline-1000.webp 1000w, /footer-skyline-2000.webp 2000w" 
          type="image/webp" 
        />
        <img
          src="/footer-skyline-2000.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-[0.07] blur-[2px] saturate-150 pointer-events-none"
          width={2000}
          height={750}
          decoding="async"
          loading="lazy"
        />
      </picture>
      <div 
        className="absolute inset-0 bg-gradient-to-t from-cyber-surface via-cyber-surface/92 to-cyber-surface/85 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Left Brand Panel */}
        <section 
          aria-labelledby="footer-brand"
          className="mb-16"
        >
          <Link 
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="XFree homepage"
          >
            <picture className="shrink-0">
              <source 
                srcSet="/logo-wordmark-80.webp 1x, /logo-wordmark-160.webp 2x" 
                type="image/webp" 
              />
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
            <span 
              id="footer-brand" 
              className="sr-only"
            >
              XFree.in
            </span>
          </Link>

          <div className="mt-6 max-w-md">
            <p className="text-base leading-7 text-cyber-muted mb-4">
              FREE DEVELOPER TOOLS
            </p>
            
            <h2 className="text-2xl font-bold text-cyber-text mb-4">
              A SMARTER WEB.
              <br />
              A BRIGHTER TOMORROW.
            </h2>
            
            <p className="text-sm leading-6 text-cyber-muted mb-8">
              XFree provides privacy-first browser tools for developers, technical teams and creators. 
              Local mode is used by default for supported operations, with no signup required.
            </p>
            
            <NextLink
              href="https://app.xfree.in/"
              className="cyber-btn cyber-btn-filled text-sm px-6 py-4 rounded inline-flex items-center gap-3 hover:scale-105 transition-transform"
              rel="noopener"
            >
              <span>LAUNCH XFREE STUDIO →</span>
              <span aria-hidden="true">→</span>
            </NextLink>
          </div>
          
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm">
            <div>
              <div className="text-3xl font-black text-cyber-glow font-cyber">
                {footerStats.tools}
              </div>
              <div className="text-xs text-cyber-muted font-mono uppercase tracking-wider">
                TOOLS
              </div>
            </div>
            
            <div>
              <div className="text-3xl font-black text-cyber-glow font-cyber">
                {footerStats.pillars}
              </div>
              <div className="text-xs text-cyber-muted font-mono uppercase tracking-wider">
                PILLAR HUBS
              </div>
            </div>
            
            <div>
              <div className="text-3xl font-black text-cyber-glow font-cyber">
                0
              </div>
              <div className="text-xs text-cyber-muted font-mono uppercase tracking-wider">
                SIGNUPS
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Grid */}
        <nav 
          aria-label="XFree footer navigation"
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-6 mb-16"
        >
          {/* CATEGORIES */}
          <section aria-labelledby="footer-categories">
            <h2 
              id="footer-categories"
              className="text-sm font-semibold text-cyber-glow font-mono uppercase tracking-wider"
            >
              {t('categoriesHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link 
                  href="/categories/developer-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Developer Tools
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/seo-url-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree SEO Tools
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/security-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Security Tools
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/text-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Text & Diff Tools
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/converters"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Converters & Encoders
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/generators"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Generators
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/validators"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Validators
                </Link>
              </li>
              <li>
                <Link 
                  href="/tools"
                  className="text-sm text-cyber-glow hover:text-cyber-text transition-colors font-medium"
                >
                  {t('allTools')} →
                </Link>
              </li>
            </ul>
          </section>

          {/* POPULAR */}
          <section aria-labelledby="footer-popular">
            <h2 
              id="footer-popular"
              className="text-sm font-semibold text-cyber-cyan font-mono uppercase tracking-wider"
            >
              {t('popularHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              {TOOLS.slice(0, 6).map((tool) => (
                <li key={tool.id}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                  >
                    XFree {tool.title.replace('XFree ', '')}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/tools"
                  className="text-sm text-cyber-cyan hover:text-cyber-text transition-colors font-medium"
                >
                  {t('viewAllPopular')} →
                </Link>
              </li>
            </ul>
          </section>

          {/* TOOL HUBS */}
          <section aria-labelledby="footer-pillars">
            <h2 
              id="footer-pillars"
              className="text-sm font-semibold text-cyber-magenta font-mono uppercase tracking-wider"
            >
              {t('toolHubsHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/pillars/json-data-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree JSON & Data Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/regex-pattern-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Regex Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/encoding-conversion-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Encoding Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/hash-generator-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Security Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/generator-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree Generator Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/seo-audit-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree SEO Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars/dns-lookup-tools"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  Xfree DNS & Network Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars"
                  className="text-sm text-cyber-magenta hover:text-cyber-text transition-colors font-medium"
                >
                  {t('viewAllHubs')} →
                </Link>
              </li>
            </ul>
          </section>

          {/* RESOURCES */}
          <section aria-labelledby="footer-resources">
            <h2 
              id="footer-resources"
              className="text-sm font-semibold text-cyber-amber font-mono uppercase tracking-wider"
            >
              {t('resourcesHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/updates"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('signals')}
                </Link>
              </li>
              <li>
                <Link
                  href="/pillars"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('pillarHubs')}
                </Link>
              </li>
              <li>
                <NextLink
                  href="/sitemap.xml"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('xmlSitemap')}
                </NextLink>
              </li>
              <li>
                <NextLink
                  href="/robots.txt"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('robotsTxt')}
                </NextLink>
              </li>
            </ul>
          </section>

          {/* COMPANY */}
          <section aria-labelledby="footer-legal">
            <h2 
              id="footer-legal"
              className="text-sm font-semibold text-cyber-text font-mono uppercase tracking-wider"
            >
              {t('companyHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </section>

          {/* COMMUNITY */}
          <section aria-labelledby="footer-community">
            <h2 
              id="footer-community"
              className="text-sm font-semibold text-cyber-glow font-mono uppercase tracking-wider"
            >
              {t('communityHeading')}
            </h2>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="https://github.com/CodesbyFebin/xfree"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors inline-flex items-center gap-1"
                >
                  {t('githubRepo')} <span aria-hidden="true" className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/CodesbyFebin/xfree/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors inline-flex items-center gap-1"
                >
                  {t('reportIssue')} <span aria-hidden="true" className="text-[10px]">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/CodesbyFebin/xfree/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cyber-muted hover:text-cyber-text transition-colors inline-flex items-center gap-1"
                >
                  {t('contribute')} <span aria-hidden="true" className="text-[10px]">↗</span>
                </a>
              </li>
            </ul>
          </section>
        </nav>

        {/* What's New Section */}
        <section className="mt-16 pt-8 border-t border-cyber-border">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4">
              <span className="text-xs font-mono text-cyber-glow uppercase tracking-wider">
                WHAT'S NEW IN XFREE
              </span>
            </div>
            
            <h2 className="text-3xl font-bold text-cyber-text mb-4">
              New Tools. More Possibilities.
            </h2>
            
            <p className="text-cyber-muted mb-8 max-w-xl mx-auto">
              Stay updated with the latest tools, features and improvements in XFree Studio.
            </p>
            
            <NextLink
              href="/updates"
              className="cyber-btn cyber-btn-outline text-sm px-6 py-3 rounded inline-flex items-center gap-2 hover:bg-cyber-glow/10"
            >
              <span>EXPLORE WHAT'S NEW →</span>
            </NextLink>
          </div>
        </section>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-cyber-border">
          <div className="flex flex-col gap-4 text-xs text-cyber-dim sm:flex-row sm:items-center sm:justify-between">
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
      </div>
    </footer>
  );
}