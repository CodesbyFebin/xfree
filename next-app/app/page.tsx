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
  keywords: ['free developer tools', 'free seo tools', 'json formatter free', 'regex tester free', 'sitemap generator free', 'password generator free', 'privacy tools', 'browser based tools', 'no signup tools', 'XFree tools', 'online developer tools', 'free utilities'],
  openGraph: { title: 'XFree | 150+ Free Privacy-First Developer & SEO Tools', description: 'Access 150+ completely free developer and SEO tools.', url: 'https://www.xfree.in', type: 'website', siteName: 'XFree', images: [{ url: 'https://www.xfree.in/og-image.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'XFree | 150+ Free Privacy-First Developer & SEO Tools', description: 'Access 150+ completely free developer and SEO tools.', images: ['https://www.xfree.in/og-image.png'] },
  alternates: { canonical: buildCanonical('/') },
};

export default function HomePage() {
  const featuredTools = FEATURED_TOOLS.slice(0, 6);
  const indexableTools = TOOLS.filter(t => t.indexable);
  const topTools = indexableTools.slice(0, 12);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'XFree - Free Developer & SEO Tools', url: 'https://www.xfree.in', description: '150+ free online tools for developers and SEO professionals.', applicationCategory: 'DeveloperApplication', operatingSystem: 'Web Browser', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '12847', bestRating: '5', worstRating: '1' } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ_DATA.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to use XFree tools', step: [{ '@type': 'HowToStep', name: 'Choose a tool', text: 'Browse categories or search for the tool you need' }, { '@type': 'HowToStep', name: 'Enter your data', text: 'Input text, JSON, URLs, or other data into the tool' }, { '@type': 'HowToStep', name: 'Get instant results', text: 'View formatted, validated, or converted output instantly' }] }) }} />
      <div className="min-h-screen bg-cyber-bg text-cyber-text">
        <Header />

        <main id="main-content">
          {/* HERO */}
          <section className="relative border-b border-cyber-border overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="glow-orb bg-cyber-glow w-96 h-96 -top-48 left-1/4" />
            <div className="glow-orb bg-cyber-cyan w-96 h-96 -bottom-48 right-1/4" />
            <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="mono text-xs text-cyber-glow bg-cyber-glow/10 px-3 py-1 rounded-full border border-cyber-glow/30">Free Forever</span>
                <span className="mono text-xs text-cyber-muted bg-white/5 px-3 py-1 rounded-full border border-cyber-border">No Signup</span>
                <span className="mono text-xs text-cyber-cyan bg-cyber-cyan/10 px-3 py-1 rounded-full border border-cyber-cyan/30">Privacy-First</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                <span className="text-cyber-glow neon-green">XFree</span>: 150+ Free
                <br className="hidden md:block" />
                <span className="text-white"> Developer & SEO Tools</span>
              </h1>
              <p className="text-lg text-cyber-cyan font-mono mb-2">{'// Get X Done for Free — Fast, Private, No Sign-Up'}</p>
              <p className="text-base text-cyber-muted max-w-2xl mx-auto mb-8 leading-relaxed">
                The ultimate free online toolbox for developers. Format JSON, test regex patterns, generate sitemaps, encode Base64, decode JWTs, create secure passwords, and 140+ more tools.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-glow text-cyber-bg font-bold text-sm rounded-lg hover:bg-opacity-90 transition-all mono uppercase tracking-wider">
                  <span>Browse All Tools</span>
                  <span>→</span>
                </Link>
                <Link href="/pillars" className="inline-flex items-center gap-2 px-6 py-3 border border-cyber-border text-cyber-text font-semibold text-sm rounded-lg hover:border-cyber-glow hover:text-cyber-glow transition-all mono">
                  View Pillars
                </Link>
              </div>
              {/* Search */}
              <div className="max-w-md mx-auto relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="search" placeholder="search> JSON, Regex, Sitemap, JWT, Hash..." className="w-full pl-10 pr-4 py-3 bg-cyber-card border border-cyber-border rounded-lg text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-glow focus:ring-1 focus:ring-cyber-glow/20 text-sm" />
              </div>
              <nav className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <span className="text-[11px] text-cyber-muted font-mono">Popular:</span>
                {topTools.slice(0, 5).map(tool => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="text-[11px] text-cyber-glow hover:text-white transition-colors font-mono">{tool.title}</Link>
                ))}
              </nav>
            </div>
          </section>

          {/* STATISTICS */}
          <section className="py-12 px-4 border-b border-cyber-border bg-cyber-surface/50">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {STATISTICS.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-cyber-glow font-mono">{stat.value}</div>
                    <div className="text-xs text-cyber-muted mt-1 font-mono">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FEATURED TOOLS */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-cyber-glow font-mono">$</span> Most Popular XFree Tools
                </h2>
                <p className="text-cyber-muted font-mono">Free tools used by 500K+ developers monthly</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredTools.map(tool => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="group block bg-cyber-card border border-cyber-border rounded-xl p-5 hover:border-cyber-glow/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-lg font-mono font-bold text-cyber-glow group-hover:bg-cyber-glow group-hover:text-cyber-bg transition-all">
                        {tool.id === 'json-formatter' ? '{ }' : tool.id === 'regex-tester' ? '.*' : tool.id === 'password-generator' ? '***' : '⚡'}
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 font-mono">★ FLAGS</span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2 group-hover:text-cyber-glow transition-colors font-mono">XFree {tool.title}</h3>
                    <p className="text-sm text-cyber-muted leading-relaxed mb-3">{tool.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-cyber-dim font-mono">{tool.categoryLabel}</span>
                      <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 border border-cyber-border text-cyber-text rounded-lg hover:border-cyber-glow hover:text-cyber-glow transition-all font-mono text-sm">View All 150+ XFree Tools →</Link>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section className="py-16 px-4 bg-cyber-surface/50 border-y border-cyber-border">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-cyber-glow font-mono">$</span> Browse by Category
                </h2>
                <p className="text-cyber-muted font-mono">Find exactly what you need organized by function</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {CATEGORIES.slice(0, 8).map(cat => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="group bg-cyber-card border border-cyber-border rounded-xl p-4 text-center hover:border-cyber-glow/30 transition-all">
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">{cat.label}</h3>
                    <p className="text-[11px] text-cyber-muted line-clamp-2">{cat.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* PILLARS */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block px-3 py-1 rounded border border-cyber-cyan/30 bg-cyber-cyan/5 text-cyber-cyan text-xs font-mono mb-4">KNOWLEDGE GRAPH</span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  XFree Tool Pillars: <span className="text-cyber-glow">{PILLARS.length}</span> Organized Hubs
                </h2>
                <p className="text-cyber-muted max-w-2xl mx-auto font-mono">Each pillar connects related tools into specialized clusters for easier discovery</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {PILLARS.slice(0, 16).map(pillar => (
                  <Link key={pillar.slug} href={`/pillars/${pillar.slug}`} className="group bg-cyber-card border border-cyber-border rounded-xl p-4 hover:border-cyber-glow/30 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center text-lg flex-shrink-0">{pillar.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span>
                          <span className="text-[10px] text-cyber-dim font-mono">hub</span>
                        </div>
                        <h3 className="text-xs font-semibold text-white leading-tight group-hover:text-cyber-glow transition-colors font-mono truncate">XFree {pillar.name}</h3>
                        <p className="text-[10px] text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/pillars" className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-glow/10 border border-cyber-glow/30 text-cyber-glow rounded-lg hover:bg-cyber-glow hover:text-cyber-bg transition-all font-mono text-sm">View All {PILLARS.length} XFree Pillars →</Link>
              </div>
            </div>
          </section>

          {/* USE CASES */}
          <section className="py-16 px-4 bg-cyber-surface/50 border-y border-cyber-border">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-cyber-glow font-mono">$</span> Common Use Cases
                </h2>
                <p className="text-cyber-muted font-mono">See how developers and SEO professionals use XFree tools</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {USE_CASES.map(useCase => (
                  <div key={useCase.id} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white font-mono mb-2">{useCase.title}</h3>
                    <p className="text-xs text-cyber-muted mb-3 leading-relaxed">{useCase.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {useCase.tools.slice(0, 3).map(toolSlug => {
                        const tool = TOOLS.find(t => t.id === toolSlug);
                        if (!tool) return null;
                        return (
                          <Link key={toolSlug} href={`/tools/${toolSlug}`} className="text-[10px] px-2 py-1 rounded bg-cyber-bg border border-cyber-border text-cyber-glow hover:text-white hover:border-cyber-glow transition-colors font-mono">{tool.title}</Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-cyber-glow font-mono">$</span> What XFree Users Say
                </h2>
                <p className="text-cyber-muted font-mono">Real reviews from developers and SEO professionals</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {USER_TESTIMONIALS.slice(0, 6).map(testimonial => (
                  <div key={testimonial.id} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (<span key={i} className="text-cyber-glow text-sm">★</span>))}
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
          <section className="py-16 px-4 bg-cyber-surface/50 border-y border-cyber-border">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  <span className="text-cyber-glow font-mono">$</span> Frequently Asked Questions
                </h2>
                <p className="text-cyber-muted font-mono">Common questions about XFree tools</p>
              </div>
              <div className="space-y-3">
                {FAQ_DATA.map(faq => (
                  <div key={faq.id} className="bg-cyber-card border border-cyber-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white font-mono mb-2">{faq.question}</h3>
                    <p className="text-sm text-cyber-muted leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/faq" className="inline-flex items-center gap-2 px-6 py-3 border border-cyber-border text-cyber-text rounded-lg hover:border-cyber-glow hover:text-cyber-glow transition-all font-mono text-sm">View All FAQs →</Link>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 px-4 relative overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-mono mb-4">
                Ready to Get <span className="text-cyber-glow neon-green">X</span> Done?
              </h2>
              <p className="text-cyber-muted mb-8 max-w-lg mx-auto font-mono">150+ free tools for developers and SEO professionals. No signup, no limits, 100% private.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/tools" className="inline-flex items-center gap-2 px-8 py-3.5 bg-cyber-glow text-cyber-bg font-bold text-sm rounded-lg hover:bg-opacity-90 transition-all mono uppercase tracking-wider">
                  <span>Start Using XFree Tools</span>
                  <span>→</span>
                </Link>
                <Link href="/pillars" className="inline-flex items-center gap-2 px-8 py-3.5 border border-cyber-cyan/30 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/10 transition-all font-mono text-sm">Browse All Pillars</Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
