import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { findPillarBySlug, PILLARS, AUTHORITY_PILLARS, PILLAR_CATEGORIES } from '@/lib/data/pillars';
import { getToolsByCategory } from '@/lib/data/tools';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pillar = findPillarBySlug(slug);

  if (!pillar) {
    return { title: 'Pillar Not Found | XFree' };
  }

  const title = `${pillar.name} | XFree`;
  const description = pillar.description;

  return {
    title,
    description,
    keywords: pillar.keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.xfree.in/pillars/${slug}`,
    },
    alternates: {
      canonical: `https://www.xfree.in/pillars/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  const allPillars = [...PILLARS, ...AUTHORITY_PILLARS];
  return allPillars.map((pillar) => ({
    slug: pillar.slug,
  }));
}

export default async function PillarPage({ params }: Props) {
  const { slug } = await params;
  const pillar = findPillarBySlug(slug);

  if (!pillar) {
    notFound();
  }

  const pillarTools = getToolsByCategory(pillar.category);
  const relatedPillars = PILLARS.filter(
    (p) => p.category === pillar.category && p.slug !== slug
  ).slice(0, 6);

  const isAuthority = AUTHORITY_PILLARS.some((p) => p.slug === slug);

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm font-mono">
              <li>
                <Link href="/" className="text-cyber-muted hover:text-cyber-glow transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-cyber-dim">/</li>
              <li>
                <Link href="/pillars" className="text-cyber-muted hover:text-cyber-glow transition-colors">
                  Pillars
                </Link>
              </li>
              <li className="text-cyber-dim">/</li>
              <li className="text-cyber-glow" aria-current="page">
                {pillar.name.replace('XFree ', '')}
              </li>
            </ol>
          </nav>

          {/* Pillar Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                <span className="text-3xl">{pillar.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-cyber-dim">#{pillar.num}</span>
                  {isAuthority && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20">
                      Authority
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {pillar.name}
                </h1>
                <p className="text-cyber-muted">{pillar.description}</p>
              </div>
            </div>

            {pillar.keywords && pillar.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {pillar.keywords.slice(0, 8).map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs font-mono px-2 py-1 rounded bg-cyber-surface border border-cyber-border text-cyber-muted"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Tools Grid */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Tools in this Pillar
            </h2>

            {pillarTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pillarTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="cyber-card p-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{tool.iconName}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">
                          {tool.title}
                        </h3>
                        <p className="text-xs text-cyber-muted line-clamp-2">
                          {tool.shortDescription}
                        </p>
                        <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity mt-2 block">
                          EXEC →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="cyber-card p-8 text-center">
                <p className="text-cyber-muted font-mono">
                  No published tools in this pillar yet. Check back soon!
                </p>
              </div>
            )}
          </section>

          {/* Related Pillars */}
          {relatedPillars.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-6 font-mono">
                <span className="text-cyber-glow">$</span> Related Pillars
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {relatedPillars.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/pillars/${p.slug}`}
                    className="cyber-card p-4 text-center group"
                  >
                    <span className="text-2xl mb-2 block">{p.icon}</span>
                    <span className="text-xs text-cyber-muted group-hover:text-white transition-colors font-mono">
                      {p.name.replace('XFree ', '')}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Categories */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Browse All Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PILLAR_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.id}`}
                  className="cyber-card p-4 text-center group"
                >
                  <span className="text-2xl mb-1 block">{cat.icon}</span>
                  <span className="text-xs text-cyber-muted group-hover:text-white transition-colors font-mono">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
