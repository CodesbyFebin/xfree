import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { PILLARS } from '@/lib/data/pillars';
import { buildCanonical } from '@/lib/canonical';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/pillars', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Pillar Hubs — XFree',
    description: 'Explore all pillar hubs: the comprehensive taxonomy of XFree micro-tools organized by topic.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("pillars", { language: loc })])
      ),
    },
  };
}

export default function PillarsPage() {
  const pillarsByCategory = PILLAR_CATEGORIES.map((cat) => ({
    ...cat,
    pillars: PILLARS.filter((p) => p.category === cat.id),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-4">Pillar Hubs</h1>
        <p className="text-cyber-muted max-w-2xl mx-auto">
          The comprehensive taxonomy of XFree micro-tools. Each pillar is a curated hub for a specific domain.
        </p>
      </div>
      <div className="space-y-12">
        {pillarsByCategory.map((category) => (
          <section key={category.id}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{category.label}</h2>
                <p className="text-sm text-cyber-muted">{category.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.pillars.map((pillar) => (
                <a
                  key={pillar.slug}
                  href={`/pillars/${pillar.slug}`}
                  className="cyber-card p-4 block hover:border-cyber-glow/50 transition-colors"
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
          </section>
        ))}
      </div>
    </div>
  );
}
