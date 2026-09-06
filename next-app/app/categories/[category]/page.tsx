import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TOOLS, CATEGORIES } from '@/lib/data/tools';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);

  if (!cat) {
    return { title: 'Category Not Found | XFree' };
  }

  return {
    title: `${cat.label} - Free Online Tools | XFree`,
    description: `Browse free ${cat.label.toLowerCase()}. ${cat.description}`,
    alternates: {
      canonical: `https://www.xfree.in/categories/${category}`,
    },
  };
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.slug,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = CATEGORIES.find((c) => c.slug === category);

  if (!cat) {
    notFound();
  }

  const categoryTools = TOOLS.filter(
    (tool) => tool.indexable && tool.category === cat.id
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
              <li className="text-cyber-glow" aria-current="page">
                {cat.label}
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                <span className="text-2xl">{cat.icon}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {cat.label}
                </h1>
                <p className="text-cyber-muted">{cat.description}</p>
              </div>
            </div>
          </header>

          {/* Tools Grid */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Available Tools (
              {categoryTools.length})
            </h2>

            {categoryTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryTools.map((tool) => (
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
            ) : (
              <div className="cyber-card p-8 text-center">
                <p className="text-cyber-muted font-mono">
                  No tools in this category yet.
                </p>
              </div>
            )}
          </section>

          {/* Other Categories */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Browse Other Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  className="cyber-card p-4 text-center group"
                >
                  <span className="text-xl mb-1 block">{c.icon}</span>
                  <span className="text-xs text-cyber-muted group-hover:text-white transition-colors font-mono">
                    {c.label}
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
