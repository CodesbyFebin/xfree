import Link from 'next/link';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { PILLARS } from '@/lib/data/pillars';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { CATEGORIES } from '@/lib/data/toolsWithSEO';
import { USER_TESTIMONIALS, USE_CASES, FAQ_DATA, STATISTICS, FEATURED_TOOLS } from '@/lib/data/content';
import { buildCanonical } from '@/lib/canonical';

export const metadata: Metadata = {
  title: 'XFree | 150+ Free Privacy-First Developer & SEO Tools',
  description: 'XFree offers 150+ completely free online tools for developers and SEO professionals. JSON formatter, regex tester, sitemap generator, password generator, and more. No signup required, 100% client-side processing.',
  keywords: [
    'free developer tools',
    'free seo tools',
    'json formatter free',
    'regex tester free',
    'sitemap generator free',
    'password generator free',
    'privacy tools',
    'browser based tools',
    'no signup tools',
    'XFree tools',
    'online developer tools',
    'free utilities',
  ],
  openGraph: {
    title: 'XFree | 150+ Free Privacy-First Developer & SEO Tools',
    description: 'Access 150+ completely free developer and SEO tools. JSON formatter, regex tester, sitemap generator, and more. Privacy-first, no signup required.',
    url: 'https://www.xfree.in',
    type: 'website',
    siteName: 'XFree',
    images: [{ url: 'https://www.xfree.in/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XFree | 150+ Free Privacy-First Developer & SEO Tools',
    description: 'Access 150+ completely free developer and SEO tools. Privacy-first, no signup required.',
    images: ['https://www.xfree.in/og-image.png'],
  },
  alternates: {
    canonical: buildCanonical('/'),
  },
};

const TOOLS_BY_CATEGORY = CATEGORIES.slice(0, 8);

export default function HomePage() {
  const featuredTools = FEATURED_TOOLS.slice(0, 6);
  const indexableTools = TOOLS.filter(t => t.indexable);
  const topTools = indexableTools.slice(0, 12);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'XFree - Free Developer & SEO Tools',
            url: 'https://www.xfree.in',
            description: '150+ free online tools for developers and SEO professionals. JSON formatter, regex tester, sitemap generator, password generator, and more.',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web Browser',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '12847',
              bestRating: '5',
              worstRating: '1',
            },
            featureList: [
              'JSON Formatter & Validator',
              'Regex Tester & Builder',
              'XML Sitemap Generator',
              'Meta Tag Generator',
              'Password Generator',
              'Hash Generator',
              'Base64 Encoder/Decoder',
              'JWT Decoder',
              'Cron Expression Generator',
              'SQL Formatter',
              'HTML/CSS/JS Minifier',
              'URL Encoder/Decoder',
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map(faq => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.xfree.in' },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to use XFree tools',
            description: 'Step-by-step guide to using XFree free online developer tools',
            step: [
              { '@type': 'HowToStep', name: 'Choose a tool', text: 'Browse categories or search for the tool you need' },
              { '@type': 'HowToStep', name: 'Enter your data', text: 'Input text, JSON, URLs, or other data into the tool' },
              { '@type': 'HowToStep', name: 'Get instant results', text: 'View formatted, validated, or converted output instantly' },
            ],
          }),
        }}
      />
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content">
        {/* HERO SECTION */}
        <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16 overflow-hidden matrix-grid" aria-labelledby="hero-heading">
          <div className="hero-orb w-[600px] h-[600px] bg-cyber-glow -top-48 -left-48 absolute" aria-hidden="true" />
          <div className="hero-orb w-[500px] h-[500px] bg-cyber-magenta top-1/3 -right-40 absolute" aria-hidden="true" />
          <div className="hero-orb w-[350px] h-[350px] bg-cyber-cyan bottom-20 left-1/4 absolute" aria-hidden="true" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-8">
              <span className="w-2 h-2 rounded-full bg-cyber-glow animate-pulse" />
              <span>XFree App · 150+ Tools · Privacy-First · No Signup</span>
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
              <span className="text-cyber-glow neon-green">XFree</span>: 150+ Free
              <br className="hidden sm:block" />
              <span className="text-white"> Developer & SEO Tools</span>
            </h1>

            <p className="text-lg sm:text-xl text-cyber-cyan font-mono mb-3">
              {'// Get X Done for Free — Fast, Private, No Sign-Up Required'}
            </p>

            <p className="text-base text-cyber-muted max-w-3xl mx-auto mb-10 leading-relaxed">
              The ultimate free online toolbox for developers. Format JSON, test regex patterns, generate sitemaps, encode Base64, decode JWTs, create secure passwords, and 140+ more tools. All processing happens in your browser.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <form action="/search" method="get" role="search">
                <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border">
                  <div className="pl-4 pr-2 text-cyber-glow"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                  <label htmlFor="heroSearch" className="sr-only">Search XFree tools</label>
                  <input type="text" id="heroSearch" name="q" placeholder="search> JSON, Regex, Sitemap, JWT, Hash, Password..." className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono" autoComplete="off" />
                  <button type="submit" className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded">EXECUTE</button>
                </div>
              </form>
              <nav className="flex items-center justify-center gap-2 mt-3 flex-wrap" aria-label="Popular searches">
                <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
                {topTools.slice(0, 5).map(tool => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="text-[11px] text-cyber-glow hover:text-white transition-colors font-mono">
                    {tool.title}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-8 text-xs text-cyber-muted font-mono">
              <span className="flex items-center gap-1.5"><span className="text-cyber-glow">⚡</span><span className="text-cyber-glow">LOCAL</span> Mode</span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-cyan">🔒</span><span className="text-cyber-cyan">PRIVACY</span>-First</span>
              <span className="hidden sm:inline text-cyber-dim">|</span>
              <span className="flex items-center gap-1.5"><span className="text-cyber-magenta">🚀</span><span className="text-cyber-magenta">ZERO</span> Sign-Up</span>
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="py-12 px-4 bg-cyber-surface/50 border-y border-cyber-border" aria-label="XFree statistics">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {STATISTICS.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-cyber-glow font-mono">{stat.value}</div>
                  <div className="text-xs text-cyber-muted font-mono mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED TOOLS */}
        <section className="py-16 px-4" aria-labelledby="featured-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-10">
              <h2 id="featured-heading" className="text-3xl font-bold text-white font-mono mb-2">
                <span className="text-cyber-glow">$</span> Most Popular XFree Tools
              </h2>
              <p className="text-cyber-muted font-mono">Free tools used by 500K+ developers monthly</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTools.map(tool => (
                <Link key={tool.id} href={`/tools/${tool.slug}`} className="cyber-card p-5 group block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-lg font-mono font-bold text-cyber-glow group-hover:neon-box-green transition-all">
                      {tool.id === 'json-formatter' ? '{ }' : tool.id === 'regex-tester' ? '.*' : tool.id === 'password-generator' ? '***' : '⚡'}
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 font-mono">★ FLAGS</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2 group-hover:text-cyber-glow transition-colors font-mono">
                    XFree {tool.title}
                  </h3>
                  <p className="text-sm text-cyber-muted leading-relaxed mb-3">{tool.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-cyber-dim font-mono">{tool.categoryLabel}</span>
                    <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/tools" className="cyber-btn px-6 py-3 rounded inline-block">View All 150+ XFree Tools →</Link>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="categories-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-10">
              <h2 id="categories-heading" className="text-3xl font-bold text-white font-mono mb-2">
                <span className="text-cyber-glow">$</span> Browse XFree Tools by Category
              </h2>
              <p className="text-cyber-muted font-mono">Find exactly what you need organized by function</p>
            </header>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {TOOLS_BY_CATEGORY.map(cat => (
                <Link key={cat.id} href={`/categories/${cat.slug}`} className="cyber-card p-5 text-center group block">
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">{cat.label}</h3>
                  <p className="text-[11px] text-cyber-muted">{cat.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="py-16 px-4" aria-labelledby="pillars-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4">KNOWLEDGE GRAPH</span>
              <h2 id="pillars-heading" className="text-3xl font-black text-white font-mono mb-2">
                XFree Tool Pillars: <span className="text-cyber-glow">{PILLARS.length}</span> Organized Hubs
              </h2>
              <p className="text-cyber-muted max-w-2xl mx-auto font-mono">Each pillar connects related tools into specialized clusters for easier discovery</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PILLARS.slice(0, 16).map(pillar => (
                <Link key={pillar.slug} href={`/pillars/${pillar.slug}`} className="cyber-card p-4 block group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center text-lg flex-shrink-0">{pillar.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span>
                        <span className="text-[10px] text-cyber-dim font-mono">hub</span>
                      </div>
                      <h3 className="text-xs font-semibold text-white leading-tight truncate group-hover:text-cyber-glow transition-colors font-mono">XFree {pillar.name}</h3>
                      <p className="text-[10px] text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/pillars" className="cyber-btn cyber-btn-cyan px-6 py-3 rounded inline-block">View All {PILLARS.length} XFree Pillars →</Link>
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="usecases-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-10">
              <h2 id="usecases-heading" className="text-3xl font-bold text-white font-mono mb-2">
                <span className="text-cyber-glow">$</span> Common XFree Use Cases
              </h2>
              <p className="text-cyber-muted font-mono">See how developers and SEO professionals use XFree tools</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 gap-4">
              {USE_CASES.map(useCase => (
                <div key={useCase.id} className="cyber-card p-5">
                  <h3 className="text-sm font-semibold text-white font-mono mb-2">{useCase.title}</h3>
                  <p className="text-xs text-cyber-muted mb-3 leading-relaxed">{useCase.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {useCase.tools.slice(0, 3).map(toolSlug => {
                      const tool = TOOLS.find(t => t.id === toolSlug);
                      if (!tool) return null;
                      return (
                        <Link key={toolSlug} href={`/tools/${toolSlug}`} className="text-[10px] px-2 py-1 rounded bg-cyber-bg border border-cyber-border text-cyber-glow hover:text-white transition-colors font-mono">
                          {tool.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS (UGC) */}
        <section className="py-16 px-4" aria-labelledby="testimonials-heading">
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-10">
              <h2 id="testimonials-heading" className="text-3xl font-bold text-white font-mono mb-2">
                <span className="text-cyber-glow">$</span> What XFree Users Say
              </h2>
              <p className="text-cyber-muted font-mono">Real reviews from developers and SEO professionals</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {USER_TESTIMONIALS.slice(0, 6).map(testimonial => (
                <div key={testimonial.id} className="cyber-card p-5">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-cyber-glow text-sm">★</span>
                    ))}
                  </div>
                  <blockquote className="text-sm text-cyber-muted mb-4 leading-relaxed italic">&ldquo;{testimonial.content}&rdquo;</blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyber-glow/20 flex items-center justify-center text-xs font-mono text-cyber-glow">{testimonial.name.charAt(0)}</div>
                    <div>
                      <div className="text-xs font-semibold text-white font-mono">{testimonial.name}</div>
                      <div className="text-[10px] text-cyber-dim">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-cyber-surface/50" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <header className="text-center mb-10">
              <h2 id="faq-heading" className="text-3xl font-bold text-white font-mono mb-2">
                <span className="text-cyber-glow">$</span> Frequently Asked Questions
              </h2>
              <p className="text-cyber-muted font-mono">Common questions about XFree tools</p>
            </header>
            <div className="space-y-4">
              {FAQ_DATA.map(faq => (
                <div key={faq.id} className="cyber-card p-5">
                  <h3 className="text-sm font-semibold text-white font-mono mb-2">{faq.question}</h3>
                  <p className="text-sm text-cyber-muted leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/faq" className="cyber-btn px-6 py-3 rounded inline-block">View All FAQs →</Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 relative overflow-hidden" aria-labelledby="cta-heading">
          <div className="absolute inset-0 matrix-grid opacity-30" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 id="cta-heading" className="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              Ready to Get <span className="text-cyber-glow neon-green">X</span> Done?
            </h2>
            <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono">150+ free tools for developers and SEO professionals. No signup, no limits, 100% private.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tools" className="cyber-btn cyber-btn-filled text-sm px-8 py-3.5 rounded inline-flex items-center gap-2">
                <span>Start Using XFree Tools</span>
                <span>→</span>
              </Link>
              <Link href="/pillars" className="cyber-btn cyber-btn-cyan text-sm px-8 py-3.5 rounded">Browse All Pillars</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
