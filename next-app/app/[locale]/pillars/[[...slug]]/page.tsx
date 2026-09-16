import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PILLARS, findPillarBySlug, getPillarsByCategory } from '@/lib/data/pillars';
import { PILLAR_CATEGORIES } from '@/lib/data/pillarCategories';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { buildCanonical, buildLanguageAlternates } from '@/lib/canonical';
import { generatePillarSchema, generateBreadcrumbSchema } from '@/lib/schema';
import { PillarCategory } from '@/lib/data/pillarCategories';
import type { Locale } from '@/i18n/routing';
import { loadContentTranslations, localizeTool, localizePillar } from '@/lib/i18n/localizedContent';

interface Props {
  params: Promise<{ slug?: string[]; locale: Locale }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;

  if (!slug || slug.length === 0) {
    return {
      title: `XFree Pillars | ${PILLARS.length} Free Tool Hubs & Categories`,
      description: `Browse XFree ${PILLARS.length} organized tool pillars covering JSON, regex, SEO, security, PDF, image, video, and more. Each pillar connects related micro-tools for easier discovery.`,
      keywords: ['XFree pillars', 'tool categories', 'tool hubs', 'developer tools', 'seo tools', 'free tools'],
      openGraph: { title: `XFree Pillars | ${PILLARS.length} Free Tool Hubs`, description: `Browse ${PILLARS.length} organized tool pillars.`, type: 'website' },
      alternates: { canonical: buildCanonical('/pillars', locale), languages: buildLanguageAlternates('/pillars') },
    };
  }

  if (slug.length === 1) {
    const rawPillar = findPillarBySlug(slug[0]);
    if (rawPillar) {
      const { pillars } = await loadContentTranslations(locale);
      const pillar = localizePillar(rawPillar, pillars);
      const path = `/pillars/${slug[0]}`;
      const canonical = buildCanonical(path, locale);
      const allKeywords = [...(pillar.keywords || []), 'XFree', 'pillar', 'tool hub', pillar.category].filter(Boolean);
      return {
        title: `XFree ${pillar.name} — Free, No Signup`,
        description: pillar.description,
        keywords: allKeywords,
        alternates: { canonical, languages: buildLanguageAlternates(path) },
        openGraph: { title: `XFree ${pillar.name}`, description: pillar.description, url: canonical, type: 'article' },
        twitter: { card: 'summary_large_image', title: `XFree ${pillar.name}`, description: pillar.description },
      };
    }
  }

  if (slug.length === 2) {
    const [category, pillarSlug] = slug;
    const rawPillar = findPillarBySlug(pillarSlug);
    if (rawPillar && rawPillar.category === category) {
      const { pillars } = await loadContentTranslations(locale);
      const pillar = localizePillar(rawPillar, pillars);
      const path = `/pillars/${category}/${pillarSlug}`;
      const canonical = buildCanonical(path, locale);
      const allKeywords = [...(pillar.keywords || []), 'XFree', pillar.category].filter(Boolean);
      return {
        title: `XFree ${pillar.name} | ${pillar.toolCount} Free Tools, No Signup`,
        description: pillar.description,
        keywords: allKeywords,
        alternates: { canonical, languages: buildLanguageAlternates(path) },
        openGraph: { title: `XFree ${pillar.name}`, description: pillar.description, url: canonical, type: 'article' },
        twitter: { card: 'summary_large_image', title: `XFree ${pillar.name}`, description: pillar.description },
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
  const { slug, locale } = await params;

  if (!slug || slug.length === 0) {
    return <PillarsIndex locale={locale} />;
  }

  if (slug.length === 1) {
    const rawPillar = findPillarBySlug(slug[0]);
    if (rawPillar) {
      const { pillars } = await loadContentTranslations(locale);
      return <PillarDetail pillar={localizePillar(rawPillar, pillars)} locale={locale} />;
    }
  }

  if (slug.length === 2) {
    const [category, pillarSlug] = slug;
    const rawPillar = findPillarBySlug(pillarSlug);
    if (rawPillar && rawPillar.category === category) {
      const { pillars } = await loadContentTranslations(locale);
      return <PillarDetail pillar={localizePillar(rawPillar, pillars)} locale={locale} />;
    }
  }

  notFound();
}

async function PillarsIndex({ locale }: { locale: Locale }) {
  const { pillars: pillarTranslations } = await loadContentTranslations(locale);
  // <Breadcrumbs> below renders its own BreadcrumbList schema (including
  // Home) - no need to also generate one here.
  const breadcrumbItems = [{ name: 'Pillars', href: '/pillars' }];

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-cyber-text font-mono mb-4">
              <span className="text-cyber-glow">$</span> XFree Tool Pillars
            </h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              {PILLARS.length} organized tool hubs covering JSON data tools, regex patterns, SEO utilities, security tools, and more.
            </p>
          </header>

          <div className="space-y-10">
            {PILLAR_CATEGORIES.map(cat => {
              const categoryPillars = getPillarsByCategory(cat.id as PillarCategory);
              if (categoryPillars.length === 0) return null;

              return (
                <section key={cat.id}>
                  <h2 className="text-xl font-bold text-cyber-text font-mono mb-4 flex items-center gap-2">
                    <span className="text-2xl">{cat.icon}</span>
                    {cat.label}
                    <span className="text-xs text-cyber-dim font-normal">({categoryPillars.length} hubs)</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryPillars.map(rawPillar => localizePillar(rawPillar, pillarTranslations)).map(pillar => (
                      <Link key={pillar.slug} href={`/pillars/${pillar.slug}`} className="cyber-card p-4 group block">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{pillar.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span>
                              <span className="text-[10px] text-cyber-dim font-mono">hub</span>
                            </div>
                            <h3 className="text-sm font-semibold text-cyber-text group-hover:text-cyber-glow transition-colors font-mono truncate">
                              XFree {pillar.name}
                            </h3>
                            <p className="text-xs text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p>
                            <span className="text-[10px] text-cyber-dim font-mono mt-2 block">{pillar.toolCount} tools</span>
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

// Pillar categories use their own id scheme (dev-tools, web-seo, ...)
// and slightly fuller label text than Header's four tool-category keys,
// but the ones covered here mean the same thing - reusing them avoids a
// whole separate translation namespace for a handful of category names.
const PILLAR_CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  'dev-tools': 'developerTools',
  'web-seo': 'seoTools',
  'ai-auto': 'aiTools',
  security: 'securityTools',
};

async function PillarDetail({ pillar, locale }: { pillar: NonNullable<ReturnType<typeof findPillarBySlug>>; locale: Locale }) {
  const { tools: toolTranslations } = await loadContentTranslations(locale);
  const categoryInfo = PILLAR_CATEGORIES.find(c => c.id === pillar.category);
  const tHeader = await getTranslations({ locale, namespace: 'Header' });
  const pillarCategoryTranslationKey = PILLAR_CATEGORY_TRANSLATION_KEYS[pillar.category];
  const categoryLabel = pillarCategoryTranslationKey ? tHeader(pillarCategoryTranslationKey) : categoryInfo?.label || pillar.category;
  const pillarTools = TOOLS.filter(t => t.pillarSlug === pillar.slug && t.indexable)
    .map(t => localizeTool(t, toolTranslations));
  // A few tools (DNS/IP/WHOIS lookup) need to reach a server and are
  // marked execution: 'workflow' for exactly that reason - don't claim
  // "100% in your browser" for a pillar that contains one.
  const allToolsAreLocal = pillarTools.every(t => t.execution !== 'workflow' && t.execution !== 'ai');
  const relatedPillars = PILLARS.filter(p => p.category === pillar.category && p.slug !== pillar.slug).slice(0, 6);
  const { pillars: pillarTranslations } = await loadContentTranslations(locale);
  const categoryPillars = getPillarsByCategory(pillar.category as PillarCategory)
    .map(p => localizePillar(p, pillarTranslations));

  // No 'Home' entry here - <Breadcrumbs> already prepends its own Home
  // link and generates+renders its own BreadcrumbList schema (see
  // components/seo/Breadcrumbs.tsx). Including Home here duplicated both
  // the visible "Home / Home / ..." trail and the JSON-LD block.
  const breadcrumbItems = [
    { name: 'Pillars', href: '/pillars' },
    { name: categoryLabel, href: `/pillars` },
    { name: pillar.name, href: `/pillars/${pillar.slug}` },
  ];

  const schema = generatePillarSchema(pillar, pillar.toolCount || pillarTools.length);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />

          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center neon-box-green">
                <span className="text-3xl">{pillar.icon}</span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-cyber-text font-mono">
                  XFree {pillar.name} <span className="text-cyber-muted font-normal">— Free, No Signup</span>
                </h1>
                <p className="text-cyber-muted mt-1">{categoryLabel} • {pillar.toolCount || pillarTools.length} tools</p>
              </div>
            </div>
            <p className="text-cyber-text text-base leading-relaxed mb-4">{pillar.description}</p>
            <div className="flex flex-wrap gap-2">
              {(pillar.keywords || []).slice(0, 6).map(keyword => (
                <span key={keyword} className="px-2 py-1 rounded text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-muted">{keyword}</span>
              ))}
            </div>
          </header>

          {pillarTools.length > 0 ? (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-cyber-text font-mono mb-6"><span className="text-cyber-glow">$</span> Tools in this Pillar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pillarTools.map(tool => (
                  <Link key={tool.id} href={`/tools/${tool.slug}`} className="cyber-card p-4 group block">
                    <h3 className="text-sm font-semibold text-cyber-text group-hover:text-cyber-glow transition-colors font-mono mb-1">XFree {tool.title}</h3>
                    <p className="text-xs text-cyber-muted line-clamp-2 mb-3">{tool.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-cyber-dim font-mono">{tool.tags.slice(0, 3).join(', ')}</span>
                      <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-12 cyber-card p-8 text-center">
              <p className="text-cyber-muted font-mono">More tools coming soon for this pillar.</p>
            </section>
          )}

          {categoryPillars.length > 1 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-cyber-text font-mono mb-6"><span className="text-cyber-glow">$</span> Related {categoryLabel} Pillars</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPillars.filter(p => p.slug !== pillar.slug).slice(0, 6).map(related => (
                  <Link key={related.slug} href={`/pillars/${related.slug}`} className="cyber-card p-4 group block">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{related.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-cyber-text group-hover:text-cyber-glow transition-colors font-mono">XFree {related.name}</h3>
                        <p className="text-xs text-cyber-muted mt-1">{related.toolCount} tools</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-12">
            <h2 className="text-xl font-bold text-cyber-text font-mono mb-6"><span className="text-cyber-glow">$</span> Why Use XFree {pillar.name}?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-card p-5">
                <h3 className="text-sm font-semibold text-cyber-text font-mono mb-2">🔒 Privacy-First</h3>
                <p className="text-xs text-cyber-muted">
                  {allToolsAreLocal
                    ? 'All tools in this pillar run 100% in your browser. Your data never leaves your device.'
                    : 'Most tools in this pillar run 100% in your browser. A few need to reach a server to do their job (see each tool\'s privacy note below) - nothing you submit there is stored.'}
                </p>
              </div>
              <div className="cyber-card p-5">
                <h3 className="text-sm font-semibold text-cyber-text font-mono mb-2">⚡ Instant Results</h3>
                <p className="text-xs text-cyber-muted">Get formatted, validated, or converted output immediately without waiting or server processing.</p>
              </div>
              <div className="cyber-card p-5">
                <h3 className="text-sm font-semibold text-cyber-text font-mono mb-2">💯 100% Free</h3>
                <p className="text-xs text-cyber-muted">No signup, no usage limits, no premium tiers. All tools are completely free forever.</p>
              </div>
              <div className="cyber-card p-5">
                <h3 className="text-sm font-semibold text-cyber-text font-mono mb-2">🔗 Interconnected</h3>
                <p className="text-xs text-cyber-muted">Tools in this pillar link to related tools for seamless workflows and better results.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
