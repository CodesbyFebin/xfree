import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { PILLARS } from '@/lib/data/pillars';
import { buildCanonical } from '@/lib/canonical';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return PILLAR_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = PILLAR_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return {};
  const canonical = buildCanonical(`/categories/${slug}`, { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: `${category.label} — XFree`,
    description: category.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical(`/categories/${slug}`, { language: loc })])
      ),
    },
  };
}

export default function CategoryDetailPage({
  params,
}: {
  params: { locale: Locale; slug: string };
}) {
  const category = PILLAR_CATEGORIES.find((c) => c.slug === params.slug);
  
  if (!category) {
    notFound();
  }

  if (!category) {
    notFound();
  }

  const categoryPillars = PILLARS.filter((p) => p.category === category.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">{category.icon}</div>
        <h1 className="text-3xl font-black text-white mb-4">{category.label}</h1>
        <p className="text-cyber-muted max-w-2xl mx-auto">{category.description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoryPillars.map((pillar) => (
          <a
            key={pillar.slug}
            href={`/pillars/${pillar.slug}`}
            className="cyber-card p-5 block hover:border-cyber-glow/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">{pillar.icon}</div>
              <div>
                <h3 className="text-sm font-semibold text-white">{pillar.name}</h3>
                <p className="text-[11px] text-cyber-muted line-clamp-1">{pillar.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
