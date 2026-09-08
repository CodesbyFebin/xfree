import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildAlternates } from '@/lib/canonical';
import { getSignals } from '@/lib/signals/fetchSignals';
import { SIGNAL_CATEGORIES, type SignalCategory } from '@/lib/signals/sources';
import { CATEGORY_RELATED_TOOLS } from '@/lib/signals/relatedTools';
import { TOOLS_WITH_SEO } from '@/lib/data/toolsWithSEO';
import { SignalCard } from '@/components/signals/SignalCard';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

interface Props {
  params: Promise<{ locale: Locale; category: string }>;
}

export function generateStaticParams() {
  return SIGNAL_CATEGORIES.map((c) => ({ category: c.id }));
}

function getCategory(slug: string) {
  return SIGNAL_CATEGORIES.find((c) => c.id === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.label} News & Signals | XFree`,
    description: `Curated ${cat.label.toLowerCase()} news from authoritative developer sources, categorized and cross-linked to relevant XFree tools.`,
    alternates: buildAlternates(`/updates/${category}`, locale),
  };
}

export default async function UpdatesCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const allSignals = await getSignals(80);
  const signals = allSignals.filter((item) => item.categories.includes(category as SignalCategory));
  const relatedSlugs = CATEGORY_RELATED_TOOLS[category as SignalCategory] ?? [];
  const relatedTools = relatedSlugs
    .map((slug) => TOOLS_WITH_SEO.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text antialiased">
      <Header />
      <main id="main-content" className="pt-28 pb-20 px-4 max-w-5xl mx-auto">
        <nav className="text-xs font-mono text-cyber-muted mb-4" aria-label="Breadcrumb">
          <Link href="/updates" className="text-cyber-glow hover:underline">XFree Signals</Link> / {cat.label}
        </nav>
        <h1 className="text-3xl sm:text-4xl font-black text-cyber-text mb-4">{cat.label} News</h1>
        <p className="text-cyber-muted max-w-2xl mb-8">
          Curated {cat.label.toLowerCase()} headlines from authoritative developer sources. Every item links
          directly to its original source.
        </p>

        {relatedTools.length > 0 && (
          <div className="cyber-card p-4 mb-8">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyber-glow mb-3">Related XFree Tools</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="text-xs font-mono px-3 py-1.5 rounded border border-cyber-border text-cyber-cyan hover:text-cyber-glow hover:border-cyber-glow/50"
                >
                  {tool.title} →
                </Link>
              ))}
            </div>
          </div>
        )}

        {signals.length === 0 ? (
          <p className="text-cyber-muted font-mono text-sm">
            No {cat.label.toLowerCase()} signals available right now — check back shortly.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {signals.map((item) => (
              <SignalCard key={item.url} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
