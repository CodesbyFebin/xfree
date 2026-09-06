import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PILLARS, findPillarBySlug, getPillarsByCategory } from '@/lib/data/pillars';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { buildCanonical } from '@/lib/canonical';
import { generatePillarSchema } from '@/lib/schema';
import { PillarCategory } from '@/lib/data/pillarCategories';

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: 'Free Tool Hubs & Categories | XFree',
      description: 'Browse XFree organized tool hubs. 60+ free tools for developers, SEO, and productivity. All privacy-first, no signup required.',
      keywords: [
        'free developer tools',
        'seo tools hub',
        'tool categories',
        'XFree pillars',
        'developer tools collection',
        'free online tools',
        'privacy-first tools',
        'no signup tools',
        'XFree tool directory',
      ],
      openGraph: {
        title: 'Free Tool Hubs & Categories | XFree',
        description: 'Browse 60+ free organized tool hubs for developers and SEO professionals.',
        type: 'website',
      },
    };
  }

  if (slug.length === 1) {
    const pillar = findPillarBySlug(slug[0]);
    if (pillar) {
      const canonical = buildCanonical(`/pillars/${slug[0]}`);
      const allKeywords = [
        ...(pillar.keywords || []),
        'XFree pillar',
        'free tools hub',
        pillar.category,
      ].filter(Boolean);

      return {
        title: `XFree ${pillar.name} | Free Tool Hub`,
        description: pillar.description,
        keywords: allKeywords,
        alternates: { canonical },
        openGraph: {
          title: `XFree ${pillar.name}`,
          description: pillar.description,
          url: canonical,
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: `XFree ${pillar.name}`,
          description: pillar.description,
        },
      };
    }
  }

  if (slug.length === 2) {
    const [category, pillarSlug] = slug;
    const pillar = findPillarBySlug(pillarSlug);
    if (pillar && pillar.category === category) {
      const canonical = buildCanonical(`/pillars/${category}/${pillarSlug}`);
      const allKeywords = [
        ...(pillar.keywords || []),
        'XFree pillar',
        'free tools hub',
        pillar.category,
      ].filter(Boolean);

      return {
        title: `XFree ${pillar.name} | ${pillar.toolCount || 0} Free Tools`,
        description: pillar.description,
        keywords: allKeywords,
        alternates: { canonical },
        openGraph: {
          title: `XFree ${pillar.name}`,
          description: pillar.description,
          url: canonical,
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title: `XFree ${pillar.name}`,
          description: pillar.description,
        },
      };
    }
  }

  return { title: 'Pillars | XFree' };
}

export async function generateStaticParams() {
  const params: { slug: string[] }[] = [];

  params.push({ slug: [] });

  PILLARS.forEach(pillar => {
    params.push({ slug: [pillar.slug] });
    params.push({ slug: [pillar.category, pillar.slug] });
  });

  return params;
}

export default async function PillarPage({ params }: Props) {
  const { slug } = await params;

  if (!slug || slug.length === 0) {
    return <PillarsIndex />;
  }

  if (slug.length === 1) {
    const pillar = findPillarBySlug(slug[0]);
    if (pillar) {
      return <PillarDetail pillar={pillar} />;
    }
  }

  if (slug.length === 2) {
    const [category, pillarSlug] = slug;
    const pillar = findPillarBySlug(pillarSlug);
    if (pillar && pillar.category === category) {
      return <PillarDetail pillar={pillar} />;
    }
  }

  notFound();
}

function PillarsIndex() {
  const breadcrumbItems: { name: string; href: string }[] = [];

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4">
              <span className="text-cyber-glow">$</span> XFree Tool Pillars
            </h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              Organized tool hubs covering {PILLARS.length} topic areas for developers and SEO professionals.
            </p>
          </header>

          <div className="space-y-8">
            {PILLAR_CATEGORIES.map(cat => {
              const categoryPillars = getPillarsByCategory(cat.id as PillarCategory);
              if (categoryPillars.length === 0) return null;

              return (
                <section key={cat.id}>
                  <h2 className="text-xl font-bold text-white font-mono mb-4 flex items-center gap-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {cat.label}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryPillars.map(pillar => (
                      <Link
                        key={pillar.slug}
                        href={`/pillars/${pillar.slug}`}
                        className="cyber-card p-4 group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{pillar.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono truncate">
                              {pillar.name}
                            </h3>
                            <p className="text-xs text-cyber-muted mt-1 line-clamp-2">
                              {pillar.description}
                            </p>
                            <span className="text-[10px] text-cyber-dim font-mono mt-2 block">
                              {pillar.toolCount || 0} tools
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function PillarDetail({ pillar }: { pillar: NonNullable<ReturnType<typeof findPillarBySlug>> }) {
  const categoryInfo = PILLAR_CATEGORIES.find(c => c.id === pillar.category);
  const pillarTools = TOOLS.filter(t => t.pillarSlug === pillar.slug);
  const relatedPillars = PILLARS.filter(p => p.category === pillar.category && p.slug !== pillar.slug).slice(0, 6);

  const breadcrumbItems = [
    { name: 'Pillars', href: '/pillars' },
    { name: categoryInfo?.label || pillar.category, href: `/pillars` },
    { name: pillar.name, href: `/pillars/${pillar.slug}` },
  ];

  const schema = generatePillarSchema(pillar, pillar.toolCount || pillarTools.length);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                <span className="text-3xl">{pillar.icon}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  XFree {pillar.name}
                </h1>
                <p className="text-cyber-muted mt-1">
                  {categoryInfo?.label} • {pillar.toolCount || pillarTools.length} tools
                </p>
              </div>
            </div>
            <p className="text-cyber-text text-base leading-relaxed">
              {pillar.description}
            </p>
          </header>

          {pillarTools.length > 0 ? (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white font-mono mb-6">
                <span className="text-cyber-glow">$</span> Tools in this Pillar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pillarTools.map((tool) => (
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
                        {tool.tags.slice(0, 3).join(', ')}
                      </span>
                      <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        EXEC →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white font-mono mb-6">
                <span className="text-cyber-glow">$</span> Tools in this Pillar
              </h2>
              <div className="cyber-card p-8 text-center">
                <p className="text-cyber-muted font-mono">
                  More tools coming soon for this pillar.
                </p>
              </div>
            </section>
          )}

          {relatedPillars.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white font-mono mb-6">
                <span className="text-cyber-glow">$</span> Related Pillars
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedPillars.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/pillars/${related.slug}`}
                    className="cyber-card p-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{related.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono">
                          {related.name}
                        </h3>
                        <p className="text-xs text-cyber-muted mt-1 line-clamp-1">
                          {related.toolCount || 0} tools
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
