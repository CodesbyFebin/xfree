import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { TrustBadge } from '@/components/analytics/TrustBadge';
import { TOOLS, CATEGORIES, findToolById } from '@/lib/data/toolsWithSEO';
import { findPillarBySlug } from '@/lib/data/pillars';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { buildCanonical } from '@/lib/canonical';
import { generateToolSchema, generateFAQSchema } from '@/lib/schema';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: 'Free Developer & SEO Tools | XFree',
      description: '100% free online tools for developers and SEO professionals. JSON formatter, regex tester, Base64 encoder, hash generator, and 60+ more privacy-first tools.',
      keywords: [
        'free developer tools',
        'online json formatter',
        'regex tester',
        'base64 encoder',
        'hash generator',
        'free seo tools',
        'privacy tools',
        'no signup tools',
        'browser based tools',
        'XFree tools',
      ],
      openGraph: {
        title: 'Free Developer & SEO Tools | XFree',
        description: '100% free online tools for developers. JSON formatter, regex tester, and 60+ more.',
        type: 'website',
      },
    };
  }

  const toolSlug = slug[slug.length - 1];
  const tool = findToolById(toolSlug);

  if (tool) {
    const canonical = buildCanonical(`/tools/${tool.slug}`);
    const fullDescription = tool.longDescription || tool.shortDescription;
    const allKeywords = [
      ...(tool.seoKeywords || []),
      ...tool.tags,
      'XFree',
      'free online tool',
    ].filter(Boolean);

    return {
      title: `${tool.title} | XFree - Free Online Tool`,
      description: fullDescription,
      keywords: allKeywords,
      alternates: { canonical },
      openGraph: {
        title: `${tool.title} | XFree`,
        description: fullDescription,
        url: canonical,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${tool.title} | XFree`,
        description: fullDescription,
      },
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
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              <span className="text-cyber-glow">$</span> XFree Tools
            </h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              {TOOLS.filter(t => t.indexable).length} free privacy-first tools for developers and SEO professionals.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.filter(t => t.indexable).map(tool => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="cyber-card p-4 group"
              >
                <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">
                  {tool.title}
                </h3>
                <p className="text-xs text-cyber-muted line-clamp-2 mb-3">
                  {tool.shortDescription}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyber-dim font-mono">
                    {tool.tags.slice(0, 2).join(', ')}
                  </span>
                  <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    EXEC →
                  </span>
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
  const relatedTools = tool.relatedToolIds
    .map(id => findToolById(id))
    .filter(Boolean)
    .slice(0, 6);

  const breadcrumbItems = [
    { name: 'Tools', href: '/pillars' },
    { name: categoryInfo?.label || tool.category, href: `/categories/${categoryInfo?.slug}` },
    { name: tool.title, href: `/tools/${tool.slug}` },
  ];

  const toolSchema = generateToolSchema(tool);
  const faqSchema = tool.faqs.length > 0 ? generateFAQSchema(tool.faqs) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {tool.title}
                  </h1>
                  <p className="text-cyber-muted mt-1">
                    {categoryInfo?.label}
                  </p>
                </div>
              </div>
              <TrustBadge tool={tool} />
            </div>
            <p className="text-cyber-text text-base leading-relaxed mb-4">
              {tool.explanation}
            </p>
            <div className="flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <section className="cyber-card p-6 mb-6">
                <h2 className="text-lg font-bold text-white font-mono mb-4">
                  <span className="text-cyber-glow">$</span> How to Use
                </h2>
                <ol className="space-y-2">
                  {tool.howToUse.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-cyber-glow text-xs font-mono flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-cyber-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {tool.privacyNotice && (
                <section className="cyber-card p-6 mb-6 border-green-500/20">
                  <h2 className="text-lg font-bold text-white font-mono mb-3 flex items-center gap-2">
                    <span className="text-green-400">🔒</span> Privacy
                  </h2>
                  <p className="text-sm text-cyber-muted">
                    {tool.privacyNotice}
                  </p>
                </section>
              )}

              {tool.exampleInput && (
                <section className="cyber-card p-6 mb-6">
                  <h2 className="text-lg font-bold text-white font-mono mb-4">
                    <span className="text-cyber-glow">$</span> Example
                  </h2>
                  <div className="mb-3">
                    <span className="text-xs text-cyber-dim font-mono block mb-2">INPUT:</span>
                    <pre className="p-3 rounded bg-cyber-bg border border-cyber-border overflow-x-auto text-xs font-mono text-cyber-glow">
                      {tool.exampleInput}
                    </pre>
                  </div>
                </section>
              )}

              {tool.faqs.length > 0 && (
                <section className="cyber-card p-6">
                  <h2 className="text-lg font-bold text-white font-mono mb-4">
                    <span className="text-cyber-glow">$</span> FAQ
                  </h2>
                  <div className="space-y-4">
                    {tool.faqs.map((faq, i) => (
                      <div key={i} className="border-b border-cyber-border pb-4 last:border-0">
                        <h3 className="text-sm font-semibold text-white mb-2">{faq.question}</h3>
                        <p className="text-sm text-cyber-muted">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div>
              {pillar && (
                <div className="cyber-card p-4 mb-4">
                  <h3 className="text-xs text-cyber-dim font-mono mb-2">PILLAR HUB</h3>
                  <Link href={`/pillars/${pillar.slug}`} className="flex items-center gap-2 group">
                    <span className="text-xl">{pillar.icon}</span>
                    <span className="text-sm text-white group-hover:text-cyber-glow transition-colors">
                      {pillar.name}
                    </span>
                  </Link>
                </div>
              )}

              {relatedTools.length > 0 && (
                <div className="cyber-card p-4">
                  <h3 className="text-xs text-cyber-dim font-mono mb-3">RELATED TOOLS</h3>
                  <div className="space-y-2">
                    {relatedTools.map((related) => (
                      related && (
                        <Link
                          key={related.id}
                          href={`/tools/${related.slug}`}
                          className="block text-sm text-cyber-muted hover:text-cyber-glow transition-colors py-1"
                        >
                          {related.title}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
