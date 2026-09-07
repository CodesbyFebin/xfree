import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { PILLARS } from '@/lib/data/pillars';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { GUIDES } from '@/lib/data/guides';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    description:
      'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, XFree JSON formatters, XFree HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical('/', { language: loc })])
      ),
    },
  };
}

export default function HomePage() {
  const featuredPillars = PILLARS.slice(0, 6);
  const featuredTools = TOOLS.filter((t) => t.indexable).slice(0, 6);
  const featuredGuides = GUIDES.slice(0, 3);

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow animate-pulse" />
            Privacy-First Tools · No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Free Developer, SEO &amp; Privacy{' '}
            <span className="text-cyber-glow">Micro-Tools</span>
          </h1>
          <p className="text-lg text-cyber-muted max-w-2xl mx-auto mb-8">
            100% client-side. Zero tracking. Open source. Get X done with XFree — the ultimate free online app for developers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/pillars" className="cyber-btn cyber-btn-filled px-6 py-3 rounded-lg text-sm">
              Explore Pillars
            </a>
            <a href="/tools" className="cyber-btn px-6 py-3 rounded-lg text-sm">
              Browse Tools
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-cyber-surface/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            <span className="text-cyber-glow">$</span> Featured Pillars
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPillars.map((pillar) => (
              <a
                key={pillar.slug}
                href={`/pillars/${pillar.slug}`}
                className="cyber-card p-5 block hover:border-cyber-glow/50 transition-colors"
              >
                <div className="text-2xl mb-3">{pillar.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">{pillar.name}</h3>
                <p className="text-xs text-cyber-muted line-clamp-2">{pillar.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            <span className="text-cyber-cyan">⚡</span> Popular Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <a
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="cyber-card p-5 block hover:border-cyber-cyan/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center text-cyber-cyan">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{tool.title}</h3>
                    <span className="text-[10px] text-cyber-muted font-mono">{tool.categoryLabel}</span>
                  </div>
                </div>
                <p className="text-xs text-cyber-muted line-clamp-2">{tool.shortDescription}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-cyber-surface/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            <span className="text-cyber-magenta">📚</span> Guides &amp; Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredGuides.map((guide) => (
              <a
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="cyber-card p-5 block hover:border-cyber-magenta/50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-white mb-2">{guide.title}</h3>
                <p className="text-xs text-cyber-muted line-clamp-2">{guide.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            <span className="text-cyber-glow">📂</span> Categories
          </h2>
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
      </section>
    </div>
  );
}
