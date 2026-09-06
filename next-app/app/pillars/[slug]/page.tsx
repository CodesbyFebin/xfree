import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { findPillarBySlug, PILLARS } from '@/lib/data/pillars';
import { TOOLS } from '@/lib/data/tools';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pillar = findPillarBySlug(slug);

  if (!pillar) {
    return { title: 'Pillar Not Found | XFree' };
  }

  return {
    title: `${pillar.name} | Free Online Tools`,
    description: pillar.description,
    openGraph: {
      title: pillar.name,
      description: pillar.description,
      type: 'website',
      url: `https://www.xfree.in/pillars/${slug}`,
    },
    alternates: {
      canonical: `https://www.xfree.in/pillars/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return PILLARS.map((pillar) => ({
    slug: pillar.slug,
  }));
}

export default async function PillarPage({ params }: Props) {
  const { slug } = await params;
  const pillar = findPillarBySlug(slug);

  if (!pillar) {
    notFound();
  }

  const pillarTools = TOOLS.filter(
    (tool) => tool.indexable && tool.pillarKeyword === slug
  );

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
                <Link
                  href="/pillars"
                  className="text-cyber-muted hover:text-cyber-glow transition-colors"
                >
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
              <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                <span className="text-2xl">{pillar.icon}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {pillar.name}
                </h1>
                <p className="text-cyber-muted">{pillar.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm font-mono text-cyber-muted">
              <span>
                <span className="text-cyber-glow">{pillarTools.length}</span> published tools
              </span>
              <span>Pillar #{pillar.num}</span>
            </div>
          </header>

          {/* Tools Grid */}
          <section>
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
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-cyber-muted line-clamp-2">
                      {tool.shortDescription}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-cyber-dim font-mono">
                        {tool.categoryLabel}
                      </span>
                      <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        EXEC →
                      </span>
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

          {/* Other Pillars */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Explore Other Pillars
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PILLARS.filter((p) => p.slug !== slug)
                .slice(0, 8)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/pillars/${p.slug}`}
                    className="cyber-card p-3 text-center group"
                  >
                    <span className="text-xl mb-1 block">{p.icon}</span>
                    <span className="text-xs text-cyber-muted group-hover:text-white transition-colors font-mono">
                      {p.name.replace('XFree ', '')}
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
