import type { ComponentType } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { TrustBadge } from '@/components/analytics/TrustBadge';
import { TOOLS, CATEGORIES, findToolById } from '@/lib/data/toolsWithSEO';
import { findPillarBySlug, PILLARS } from '@/lib/data/pillars';
import { buildCanonical, buildLanguageAlternates } from '@/lib/canonical';
import { generateToolSchema, generateFAQSchema, generateHowToSchema, generateBreadcrumbSchema } from '@/lib/schema';
import { USE_CASES } from '@/lib/data/content';
import type { Locale } from '@/i18n/routing';
import { JsonFormatterTool } from '@/components/tools/JsonFormatterTool';
import { RegexTesterTool } from '@/components/tools/RegexTesterTool';
import { Base64Tool } from '@/components/tools/Base64Tool';
import { HashGeneratorTool } from '@/components/tools/HashGeneratorTool';
import { PasswordGeneratorTool } from '@/components/tools/PasswordGeneratorTool';
import { UuidGeneratorTool } from '@/components/tools/UuidGeneratorTool';
import { JwtDecoderTool } from '@/components/tools/JwtDecoderTool';
import { SitemapGeneratorTool } from '@/components/tools/SitemapGeneratorTool';
import { RobotsTxtGeneratorTool } from '@/components/tools/RobotsTxtGeneratorTool';
import { MetaTagGeneratorTool } from '@/components/tools/MetaTagGeneratorTool';
import { CronGeneratorTool } from '@/components/tools/CronGeneratorTool';
import { UrlEncoderTool } from '@/components/tools/UrlEncoderTool';
import { WordCounterTool } from '@/components/tools/WordCounterTool';
import { CaseConverterTool } from '@/components/tools/CaseConverterTool';
import { SlugGeneratorTool } from '@/components/tools/SlugGeneratorTool';
import { DiffTool } from '@/components/tools/DiffTool';
import { MarkdownTableGeneratorTool } from '@/components/tools/MarkdownTableGeneratorTool';
import { JsonToCsvTool } from '@/components/tools/JsonToCsvTool';
import { CsvToJsonTool } from '@/components/tools/CsvToJsonTool';
import { ColorConverterTool } from '@/components/tools/ColorConverterTool';
import { ColorPaletteTool } from '@/components/tools/ColorPaletteTool';
import { RandomStringTool } from '@/components/tools/RandomStringTool';
import { RandomNumberTool } from '@/components/tools/RandomNumberTool';
import { RandomColorTool } from '@/components/tools/RandomColorTool';
import { UtmBuilderTool } from '@/components/tools/UtmBuilderTool';
import { BulkUrlExtractorTool } from '@/components/tools/BulkUrlExtractorTool';
import { EmailValidatorTool } from '@/components/tools/EmailValidatorTool';
import { UrlValidatorTool } from '@/components/tools/UrlValidatorTool';
import { CreditCardValidatorTool } from '@/components/tools/CreditCardValidatorTool';
import { XmlValidatorTool } from '@/components/tools/XmlValidatorTool';
import { HmacGeneratorTool } from '@/components/tools/HmacGeneratorTool';
import { JwtEncoderTool } from '@/components/tools/JwtEncoderTool';
import { HtmlMinifierTool } from '@/components/tools/HtmlMinifierTool';
import { CssMinifierTool } from '@/components/tools/CssMinifierTool';
import { RegexExplainerTool } from '@/components/tools/RegexExplainerTool';
import { RegexBuilderTool } from '@/components/tools/RegexBuilderTool';

// Only these tool ids have a real, working interactive component. Every
// other tool page shows content/SEO copy only, with a link out to XFree
// Studio to actually run it - do not claim in-page interactivity for an
// id that isn't in this map, and do not add an id here without a real
// component behind it (see the "Quick Answer" copy on the ToolDetail
// component below, which reads directly off this map).
const TOOL_COMPONENTS: Record<string, ComponentType> = {
  'json-formatter': JsonFormatterTool,
  'regex-tester': RegexTesterTool,
  'base64-encode': Base64Tool,
  'base64-decode': Base64Tool,
  'hash-generator': HashGeneratorTool,
  'sha256-hash': HashGeneratorTool,
  'md5-hash': HashGeneratorTool,
  'password-generator': PasswordGeneratorTool,
  'uuid-generator': UuidGeneratorTool,
  'jwt-decoder': JwtDecoderTool,
  'xml-sitemap-generator': SitemapGeneratorTool,
  'robots-txt-generator': RobotsTxtGeneratorTool,
  'meta-tag-generator': MetaTagGeneratorTool,
  'cron-generator': CronGeneratorTool,
  'cron-parser': CronGeneratorTool,
  'url-encode': UrlEncoderTool,
  'url-decode': UrlEncoderTool,
  'word-counter': WordCounterTool,
  'case-converter': CaseConverterTool,
  'slug-generator': SlugGeneratorTool,
  'diff-tool': DiffTool,
  'table-generator': MarkdownTableGeneratorTool,
  'json-to-csv': JsonToCsvTool,
  'csv-to-json': CsvToJsonTool,
  'json-minify': JsonFormatterTool,
  'json-validator': JsonFormatterTool,
  'color-converter': ColorConverterTool,
  'hex-to-rgb': ColorConverterTool,
  'rgb-to-hex': ColorConverterTool,
  'color-palette': ColorPaletteTool,
  'random-string': RandomStringTool,
  'random-number': RandomNumberTool,
  'random-color': RandomColorTool,
  'utm-builder': UtmBuilderTool,
  'bulk-url-extractor': BulkUrlExtractorTool,
  'email-validator': EmailValidatorTool,
  'url-validator': UrlValidatorTool,
  'credit-card-validator': CreditCardValidatorTool,
  'xml-validator': XmlValidatorTool,
  'hmac-generator': HmacGeneratorTool,
  'jwt-encoder': JwtEncoderTool,
  'html-minifier': HtmlMinifierTool,
  'css-minifier': CssMinifierTool,
  'regex-explainer': RegexExplainerTool,
  'regex-builder': RegexBuilderTool,
};

interface Props {
  params: Promise<{ slug?: string[]; locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

  if (!slug || slug.length === 0) {
    const indexableCount = TOOLS.filter((t) => t.indexable).length;
    return {
      title: `XFree Tools | ${indexableCount}+ Free Developer & SEO Tools`,
      description: `Browse all XFree developer and SEO tools. JSON formatter, regex tester, Base64 encoder, hash generator, and ${indexableCount - 4}+ more privacy-first tools.`,
      keywords: ['free developer tools', 'seo tools', 'json formatter', 'regex tester', 'XFree'],
      openGraph: { title: `XFree Tools | ${indexableCount}+ Free Developer & SEO Tools`, description: 'Browse all XFree tools.', type: 'website' },
      alternates: { canonical: buildCanonical('/tools', locale), languages: buildLanguageAlternates('/tools') },
    };
  }

  const toolSlug = slug[slug.length - 1];
  const tool = findToolById(toolSlug);

  if (tool) {
    const canonical = buildCanonical(`/tools/${tool.slug}`, locale);
    const fullDescription = tool.longDescription || tool.shortDescription;
    const allKeywords = [
      ...(tool.seoKeywords || []),
      ...tool.tags,
      'XFree',
      'free online tool',
      `${tool.title} free`,
      `${tool.title} online`,
    ].filter(Boolean);

    // "No Signup" is a real, universally-true modifier for every tool on
    // this site (verified repeatedly - there is no account system at
    // all), so it's safe to add to every tool's title without per-tool
    // accuracy risk, unlike a feature claim (e.g. "& Validator") that
    // would be wrong for tools that aren't validators.
    return {
      title: `XFree ${tool.title} — Free Online, No Signup`,
      description: fullDescription,
      keywords: allKeywords,
      alternates: { canonical, languages: buildLanguageAlternates(`/tools/${tool.slug}`) },
      openGraph: {
        title: `XFree ${tool.title} — Free, No Signup`,
        description: fullDescription,
        url: canonical,
        type: 'article',
      },
      twitter: { card: 'summary_large_image', title: `XFree ${tool.title}`, description: fullDescription },
      other: {
        'article:published_time': new Date().toISOString(),
        'article:modified_time': new Date().toISOString(),
        'article:author': 'XFree',
        'article:section': tool.categoryLabel,
        'article:tag': tool.tags.join(', '),
      },
    };
  }

  return { title: 'Tool Not Found | XFree' };
}

export async function generateStaticParams() {
  const params: { slug: string[] }[] = [];
  params.push({ slug: [] });
  TOOLS.filter(t => t.indexable).forEach(tool => {
    params.push({ slug: [tool.slug] });
  });
  return params;
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return <ToolsIndex />;
  }

  const toolSlug = slug[slug.length - 1];
  const tool = findToolById(toolSlug);

  if (tool) {
    return <ToolDetail tool={tool} />;
  }

  notFound();
}

function ToolsIndex() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema([{ name: 'Tools', href: '/tools' }])) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header />
      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-cyber-text font-mono mb-4"><span className="text-cyber-glow">$</span> XFree Tools</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">{TOOLS.filter(t => t.indexable).length} free privacy-first tools for developers and SEO professionals.</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.filter(t => t.indexable).map(tool => (
              <Link key={tool.id} href={`/tools/${tool.slug}`} className="cyber-card p-4 group block">
                <h3 className="text-sm font-semibold text-cyber-text group-hover:text-cyber-glow transition-colors font-mono mb-1">XFree {tool.title}</h3>
                <p className="text-xs text-cyber-muted line-clamp-2 mb-3">{tool.shortDescription}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyber-dim font-mono">{tool.tags.slice(0, 2).join(', ')}</span>
                  <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ToolDetail({ tool }: { tool: NonNullable<ReturnType<typeof findToolById>> }) {
  const categoryInfo = CATEGORIES.find(c => c.id === tool.category);
  const pillar = tool.pillarSlug ? findPillarBySlug(tool.pillarSlug) : null;
  const relatedTools = tool.relatedToolIds.map(id => findToolById(id)).filter(Boolean).slice(0, 6);
  const sameCategoryTools = TOOLS.filter(t => t.category === tool.category && t.id !== tool.id && t.indexable).slice(0, 4);
  const toolUseCases = USE_CASES.filter(uc => uc.tools.includes(tool.id)).slice(0, 2);

  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: categoryInfo?.label || tool.category, href: `/categories/${categoryInfo?.slug}` },
    { name: tool.title, href: `/tools/${tool.slug}` },
  ];

  const toolSchema = generateToolSchema(tool);
  const faqSchema = tool.faqs.length > 0 ? generateFAQSchema(tool.faqs) : null;
  const howToSchema = generateHowToSchema(tool.title, tool.howToUse);
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center neon-box-green">
                  <span className="text-3xl">{tool.id === 'json-formatter' ? '{ }' : tool.id === 'regex-tester' ? '.*' : '⚡'}</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-cyber-text font-mono">
                    XFree {tool.title} <span className="text-cyber-muted font-normal">— Free, No Signup</span>
                  </h1>
                  <p className="text-cyber-muted mt-1">{categoryInfo?.label}</p>
                </div>
              </div>
              <TrustBadge tool={tool} />
            </div>
            <p className="text-cyber-text text-base leading-relaxed mb-4">{tool.longDescription || tool.explanation}</p>
            <div className="flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-muted">{tag}</span>
              ))}
            </div>
          </header>

          {/* Quick Answer - zero-click AEO block. Text is derived from
              tool.explanation (already fact-checked per-tool, not new
              copy), and the CTA honestly differs based on whether this
              id actually has a live component below or only a Studio
              link - never claims in-page use for an unwired tool. */}
          <section className="cyber-card p-4 mb-6 border-cyber-cyan/30 bg-cyber-cyan/5" aria-labelledby="quick-answer-heading">
            <h2 id="quick-answer-heading" className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-2">
              ⚡ Quick Answer
            </h2>
            <p className="text-sm text-cyber-text">
              {tool.explanation} {TOOL_COMPONENTS[tool.id]
                ? 'Use XFree ' + tool.title + ' free, right on this page, no signup required.'
                : 'Open XFree Studio to use it free, no signup required.'}
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Live Tool */}
              {(() => {
                const LiveTool = TOOL_COMPONENTS[tool.id];
                return LiveTool ? (
                  <section className="cyber-card p-6 border-cyber-glow/30" aria-labelledby="live-tool-heading">
                    <h2 id="live-tool-heading" className="text-lg font-bold text-cyber-text font-mono mb-4">
                      <span className="text-cyber-glow">$</span> Use XFree {tool.title} Now
                    </h2>
                    <LiveTool />
                  </section>
                ) : (
                  <section className="cyber-card p-6" aria-labelledby="live-tool-heading">
                    <h2 id="live-tool-heading" className="text-lg font-bold text-cyber-text font-mono mb-3">
                      <span className="text-cyber-glow">$</span> Use XFree {tool.title}
                    </h2>
                    <p className="text-sm text-cyber-muted mb-4">
                      Open XFree Studio to use {tool.title} in your browser.
                    </p>
                    <a
                      href="https://app.xfree.in/"
                      className="cyber-btn text-xs px-6 py-2.5 rounded inline-block"
                    >
                      Open in XFree Studio →
                    </a>
                  </section>
                );
              })()}

              {/* How to Use */}
              <section className="cyber-card p-6" aria-labelledby="howto-heading">
                <h2 id="howto-heading" className="text-lg font-bold text-cyber-text font-mono mb-4"><span className="text-cyber-glow">$</span> How to Use XFree {tool.title}</h2>
                <ol className="space-y-3">
                  {tool.howToUse.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-cyber-glow text-xs font-mono flex-shrink-0">{i + 1}</span>
                      <span className="text-cyber-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Example */}
              {tool.exampleInput && (
                <section className="cyber-card p-6" aria-labelledby="example-heading">
                  <h2 id="example-heading" className="text-lg font-bold text-cyber-text font-mono mb-4"><span className="text-cyber-glow">$</span> Example</h2>
                  <div className="mb-3">
                    <span className="text-xs text-cyber-dim font-mono block mb-2">INPUT:</span>
                    <pre className="p-3 rounded bg-cyber-bg border border-cyber-border overflow-x-auto text-xs font-mono text-cyber-glow">{tool.exampleInput}</pre>
                  </div>
                </section>
              )}

              {/* Privacy */}
              {tool.privacyNotice && (
                <section className="cyber-card p-6 border-green-500/20" aria-labelledby="privacy-heading">
                  <h2 id="privacy-heading" className="text-lg font-bold text-cyber-text font-mono mb-3 flex items-center gap-2"><span className="text-green-400">🔒</span> Privacy Guarantee</h2>
                  <p className="text-sm text-cyber-muted">{tool.privacyNotice}</p>
                </section>
              )}

              {/* Use Cases */}
              {toolUseCases.length > 0 && (
                <section className="cyber-card p-6" aria-labelledby="usecases-heading">
                  <h2 id="usecases-heading" className="text-lg font-bold text-cyber-text font-mono mb-4"><span className="text-cyber-glow">$</span> Common Use Cases</h2>
                  <div className="space-y-4">
                    {toolUseCases.map(uc => (
                      <div key={uc.id} className="border-b border-cyber-border pb-4 last:border-0">
                        <h3 className="text-sm font-semibold text-cyber-text mb-2">{uc.title}</h3>
                        <p className="text-sm text-cyber-muted">{uc.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {uc.tools.filter(t => t !== tool.id).slice(0, 3).map(tSlug => {
                            const t = TOOLS.find(x => x.id === tSlug);
                            return t ? (
                              <Link key={tSlug} href={`/tools/${tSlug}`} className="text-[10px] px-2 py-1 rounded bg-cyber-bg border border-cyber-border text-cyber-glow hover:text-cyber-text transition-colors font-mono">{t.title}</Link>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ */}
              {tool.faqs.length > 0 && (
                <section className="cyber-card p-6" aria-labelledby="faq-heading">
                  <h2 id="faq-heading" className="text-lg font-bold text-cyber-text font-mono mb-4"><span className="text-cyber-glow">$</span> Questions & Answers</h2>
                  <div className="space-y-4">
                    {tool.faqs.map((faq, i) => (
                      <div key={i} className="border-b border-cyber-border pb-4 last:border-0">
                        <h3 className="text-sm font-semibold text-cyber-text mb-2">{faq.question}</h3>
                        <p className="text-sm text-cyber-muted">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-4">
              {/* Pillar Hub */}
              {pillar && (
                <div className="cyber-card p-4">
                  <h3 className="text-xs text-cyber-dim font-mono mb-3">PILLAR HUB</h3>
                  <Link href={`/pillars/${pillar.slug}`} className="flex items-center gap-3 group">
                    <span className="text-2xl">{pillar.icon}</span>
                    <div>
                      <span className="text-sm text-cyber-text group-hover:text-cyber-glow transition-colors block">XFree {pillar.name}</span>
                      <span className="text-[10px] text-cyber-dim">{pillar.toolCount} tools</span>
                    </div>
                  </Link>
                  <p className="text-xs text-cyber-muted mt-2 line-clamp-2">{pillar.description}</p>
                  <Link href={`/pillars/${pillar.slug}`} className="text-xs text-cyber-glow hover:text-cyber-text transition-colors font-mono mt-2 block">View All Pillar Tools →</Link>
                </div>
              )}

              {/* Related Tools */}
              {relatedTools.length > 0 && (
                <div className="cyber-card p-4">
                  <h3 className="text-xs text-cyber-dim font-mono mb-3">RELATED TOOLS</h3>
                  <div className="space-y-2">
                    {relatedTools.map((related) => related && (
                      <Link key={related.id} href={`/tools/${related.slug}`} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-glow transition-colors py-1">
                        <span className="text-cyber-glow">→</span> XFree {related.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Same Category */}
              {sameCategoryTools.length > 0 && (
                <div className="cyber-card p-4">
                  <h3 className="text-xs text-cyber-dim font-mono mb-3">MORE {categoryInfo?.label?.toUpperCase()}</h3>
                  <div className="space-y-2">
                    {sameCategoryTools.map(t => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-glow transition-colors py-1">
                        <span className="text-cyber-glow">→</span> XFree {t.title}
                      </Link>
                    ))}
                  </div>
                  <Link href={`/categories/${categoryInfo?.slug}`} className="text-xs text-cyber-glow hover:text-cyber-text transition-colors font-mono mt-2 block">View All →</Link>
                </div>
              )}

              {/* Popular Pillars */}
              <div className="cyber-card p-4">
                <h3 className="text-xs text-cyber-dim font-mono mb-3">POPULAR PILLARS</h3>
                <div className="space-y-2">
                  {PILLARS.slice(0, 4).map(p => (
                    <Link key={p.slug} href={`/pillars/${p.slug}`} className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-glow transition-colors py-1">
                      <span>{p.icon}</span> {p.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
