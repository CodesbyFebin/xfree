import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/categories', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Tool Categories — XFree',
    description: 'Browse XFree micro-tools by category: developer tools, SEO tools, AI tools, security tools, and more.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("categories", { language: loc })])
      ),
    },
  };
}

export default function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-4">Tool Categories</h1>
        <p className="text-cyber-muted max-w-2xl mx-auto">
          Find the right tool in the right category.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {PILLAR_CATEGORIES.map((category) => (
          <a
            key={category.id}
            href={`/categories/${category.slug}`}
            className="cyber-card p-4 text-center block hover:border-cyber-glow/50 transition-colors"
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <h3 className="text-sm font-semibold text-white">{category.label}</h3>
            <p className="text-[11px] text-cyber-muted mt-1 line-clamp-1">{category.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
