import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { CATEGORIES } from '@/lib/data/tools';

const FEATURED_TOOLS = TOOLS.filter((t) => t.indexable).slice(0, 6);

export default function HomePage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content">
        {/* HERO */}
        <section
          className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden matrix-grid"
          aria-labelledby="hero-heading"
        >
          <div
            className="hero-orb w-[500px] h-[500px] bg-cyber-glow -top-40 -left-40 absolute"
            aria-hidden="true"
          />
          <div
            className="hero-orb w-[400px] h-[400px] bg-cyber-magenta top-1/4 -right-32 absolute"
            aria-hidden="true"
          />
          <div
            className="hero-orb w-[300px] h-[300px] bg-cyber-cyan bottom-20 left-1/3 absolute"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-8 neon-box-green">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow animate-pulse" />
              <span>$ XFree App · Privacy-First Tools · No Signup Required</span>
            </div>

            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-4"
            >
              XFree: The Ultimate Free
              <br />
              <span className="text-cyber-glow neon-green">
                Developer, SEO & Privacy Micro-Tools App
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-cyber-cyan font-mono mb-2">
              // Get X Done for Free — Fast, Private, No Sign-Up
            </p>

            <p className="text-base text-cyber-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              XFree is the ultimate free online app for developers. Access privacy-first SEO tools,
              XFree JSON formatters, XFree HTML minifiers, and XFree crypto utilities. 100%
              client-side, no signup required.
            </p>

            {/* SEARCH */}
            <div className="max-w-2xl mx-auto mb-6">
              <form action="/search" method="get" role="search">
                <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300">
                  <div className="pl-4 pr-2 text-cyber-glow" aria-hidden="true">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <label htmlFor="heroSearch" className="sr-only">
                    Search XFree tools
                  </label>
                  <input
                    type="text"
                    id="heroSearch"
                    name="q"
                    placeholder="search> XFree tools — JSON, Regex, Sitemap, JWT, Hash..."
                    className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono"
                    autoComplete="off"
                  />
                  <div className="flex items-center gap-2 pr-2">
                    <kbd aria-hidden="true">⌘K</kbd>
                    <button
                      type="submit"
                      className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
                    >
                      <span>EXECUTE</span>
                    </button>
                  </div>
                </div>
              </form>
              <nav
                className="flex items-center justify-center gap-2 mt-3 flex-wrap"
                aria-label="Popular XFree tool searches"
              >
                <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
                {FEATURED_TOOLS.slice(0, 4).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="text-[11px] text-cyber-glow hover:text-white transition-colors font-mono"
                  >
                    XFree {tool.title.replace('XFree ', '')}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs text-cyber-muted font-mono mt-6">
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-glow">⚡</span>
                <span className="text-cyber-glow">LOCAL</span> Mode by Default
              </span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-cyan">🔒</span>
                <span className="text-cyber-cyan">PRIVACY</span>-First
              </span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyber-magenta">🚀</span>
                <span className="text-cyber-magenta">ZERO</span> Sign-Up
              </span>
            </div>
          </div>
        </section>

        {/* FEATURED TOOLS */}
        <section className="py-14 px-4 bg-cyber-surface/50" aria-labelledby="featured-heading">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  id="featured-heading"
                  className="text-xl font-bold text-white font-mono"
                >
                  <span className="text-cyber-glow">$</span> Featured XFree Tools
                </h2>
                <p className="text-sm text-cyber-muted mt-1 font-mono">
                  // Working tools available now
                </p>
              </div>
              <Link
                href="/categories/dev-tools"
                className="text-xs text-cyber-glow hover:text-white transition-colors font-mono"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURED_TOOLS.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  className="cyber-card p-4 group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-sm font-mono font-bold text-cyber-glow group-hover:neon-box-green transition-all">
                      {tool.iconName === 'Braces' ? '{ }' : tool.iconName === 'KeyRound' ? '🎫' : tool.iconName === 'Hash' ? '#' : '⚡'}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 font-mono">
                      ★ FLAGSHIP
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyber-glow transition-colors font-mono">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-cyber-muted leading-relaxed mb-3">
                    {tool.shortDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyber-dim font-mono">
                      Category: <span className="text-cyber-muted">{tool.categoryLabel}</span>
                    </span>
                    <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      EXEC →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-14 px-4" aria-labelledby="categories-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="text-2xl font-bold text-white mb-2 font-mono">
                <span className="text-cyber-glow">ls</span> XFree Tool Categories
              </h2>
              <p className="text-cyber-muted font-mono text-sm">
                // Find the right XFree tool in the right category.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="cyber-card p-4 text-center block"
                >
                  <div className="text-2xl mb-2" aria-hidden="true">
                    {cat.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-cyber-muted mt-1">
                    {cat.slug === 'dev-tools' && 'Formatters, validators, debuggers'}
                    {cat.slug === 'seo-tools' && 'Sitemaps, meta tags, schema'}
                    {cat.slug === 'ai-tools' && 'Prompt tools, token counters'}
                    {cat.slug === 'text-tools' && 'Word count, diff, case convert'}
                    {cat.slug === 'converters' && 'JSON, CSV, Base64, YAML'}
                    {cat.slug === 'generators' && 'UUID, QR, password, cron'}
                    {cat.slug === 'validators' && 'JSON Schema, HTML, CSS'}
                    {cat.slug === 'security-tools' && 'Hash, encrypt, JWT, HMAC'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="pillars-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4 neon-box-cyan">
                // XFree Knowledge Graph
              </span>
              <h2 id="pillars-heading" className="text-3xl font-black text-white mb-3 font-mono">
                The XFree Tool Directory: <span className="text-cyber-glow">{PILLARS.length}</span>{' '}
                Pillars, <span className="text-cyber-cyan">Approved</span> Discovery Hubs
              </h2>
              <p className="text-cyber-muted max-w-2xl mx-auto font-mono text-sm">
                The most comprehensive developer tool taxonomy. Each XFree pillar connects
                specialized clusters with dedicated micro-tools.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar.slug}
                  href={`/pillars/${pillar.slug}`}
                  className="cyber-card p-3.5 block"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0"
                      aria-hidden="true"
                    >
                      {pillar.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-cyber-glow">
                          #{pillar.num}
                        </span>
                        <span className="text-[9px] text-cyber-dim font-mono">hub</span>
                      </div>
                      <h3 className="text-xs font-semibold text-white leading-tight truncate font-mono">
                        {pillar.name}
                      </h3>
                      <p className="text-[10px] text-cyber-muted mt-0.5 line-clamp-2">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/pillars" className="cyber-btn text-sm px-6 py-3 rounded inline-block">
                <span>View All XFree Pillars →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 matrix-grid opacity-50" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl font-black text-white mb-4 font-mono"
            >
              Ready to Get <span className="text-cyber-glow neon-green">X</span> Done with XFree?
            </h2>
            <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono text-sm">
              // Fast, privacy-first browser micro-tools for developers, SEO professionals,
              creators, and AI builders. No sign-up required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="https://app.xfree.in/"
                className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded inline-flex items-center gap-2"
                rel="noopener"
              >
                <span>Launch XFree Studio App</span>
                <svg
                  className="w-4 h-4 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                href="/pillars"
                className="cyber-btn cyber-btn-cyan text-sm px-8 py-3.5 rounded inline-block"
              >
                <span>Browse XFree Pillars</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'XFree',
            url: 'https://www.xfree.in',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.xfree.in/logo.png',
              width: 1200,
              height: 630,
            },
            description:
              'XFree is the ultimate free online app for developers offering privacy-first micro-tools.',
            foundingDate: '2025',
            license: 'https://opensource.org/licenses/MIT',
            sameAs: [
              'https://github.com/xfree-in/xfree',
              'https://twitter.com/xfreein',
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              contactType: 'customer support',
              email: 'support@xfree.in',
              availableLanguage: ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Japanese'],
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'XFree',
            url: 'https://www.xfree.in',
            description:
              'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities.',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: 'https://www.xfree.in/search?q={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is XFree app?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'XFree app is the ultimate free online platform for developers offering privacy-first micro-tools including XFree JSON formatters, XFree HTML minifiers, XFree SEO utilities, and XFree crypto tools. All tools run 100% client-side with no signup required.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is XFree really free with no signup?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. XFree is completely free to use with no sign-up, no account creation, and no usage limits. All tools are open-source under the MIT License and run entirely in your browser.',
                },
              },
              {
                '@type': 'Question',
                name: 'How does XFree ensure privacy?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'XFree tools run in Local Mode by default, processing your data inside your browser session using JavaScript and WebAssembly. Your input is never transmitted to external servers unless clearly disclosed.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I use XFree offline?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Because XFree tools are static HTML with embedded JavaScript, you can save any tool page and use it completely offline without an internet connection.',
                },
              },
            ],
          }),
        }}
      />
    </>
  );
}
