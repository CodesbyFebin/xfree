import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PILLARS } from '@/lib/data/pillars';
import { TOOLS } from '@/lib/data/toolsWithSEO';
import { USE_CASES, USER_TESTIMONIALS } from '@/lib/data/content';
import { buildCanonical } from '@/lib/canonical';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: { locale: string; slug?: string[] } | Promise<{ locale: string; slug?: string[] }>; }

export async function generateStaticParams() {
  const params: { locale: string; slug: string[] }[] = [];
  LOCALES.forEach(locale => {
    PILLARS.forEach(pillar => {
      params.push({ locale, slug: [pillar.slug] });
    });
  });
  return params;
}

async function resolveParams(params: Props['params']) {
  return params instanceof Promise ? await params : params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  if (!slug || slug.length === 0) {
    return { title: 'XFree Guides | Developer Tutorials', description: 'Tutorials and documentation for using XFree tools effectively.', keywords: ['XFree guides', 'developer tutorials', 'JSON formatting', 'regex patterns'], alternates: { canonical: buildCanonical('/guides', { language: locale }) } };
  }
  const pillar = PILLARS.find(p => p.slug === slug[0]);
  if (pillar) {
    const canonical = buildCanonical(`/guides/${pillar.slug}`, { language: locale });
    return { title: `XFree ${pillar.name} Guide`, description: pillar.description, keywords: [...(pillar.keywords || []), 'XFree', 'guide', 'tutorial'], alternates: { canonical }, openGraph: { title: `XFree ${pillar.name} Guide`, description: pillar.description, url: canonical, type: 'article' } };
  }
  return { title: 'Guide Not Found | XFree' };
}

export default async function GuidePage({ params }: Props) {
  const { locale, slug } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  if (!slug || slug.length === 0) return <GuidesIndex dict={dict} locale={currentLocale} />;
  const pillar = PILLARS.find(p => p.slug === slug[0]);
  if (pillar) return <GuideDetail pillar={pillar} dict={dict} locale={currentLocale} />;
  notFound();
}

function GuidesIndex({ dict, locale }: { dict: any; locale: Locale }) {
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Guides', href: `/${locale}/guides` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={locale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree Guides</h1><p className="text-cyber-muted max-w-2xl mx-auto">Tutorials and documentation for using XFree tools effectively. Learn JSON formatting, regex patterns, SEO optimization, and more.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> All Guides</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PILLARS.map(pillar => (
                <Link key={pillar.slug} href={`/${locale}/guides/${pillar.slug}`} className="cyber-card p-4 group block">
                  <div className="flex items-start gap-3"><span className="text-2xl">{pillar.icon}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span><span className="text-[10px] text-cyber-dim font-mono">guide</span></div><h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono truncate">XFree {pillar.name}</h3><p className="text-xs text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p><span className="text-[10px] text-cyber-dim font-mono mt-2 block">{pillar.toolCount} tools</span></div></div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}

function GuideDetail({ pillar, dict, locale }: { pillar: typeof PILLARS[0]; dict: any; locale: Locale }) {
  const pillarTools = TOOLS.filter(t => t.pillarSlug === pillar.slug && t.indexable);
  const relatedPillars = PILLARS.filter(p => p.category === pillar.category && p.slug !== pillar.slug).slice(0, 6);
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Guides', href: `/${locale}/guides` }, { name: pillar.name, href: `/${locale}/guides/${pillar.slug}` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={locale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center neon-box-green"><span className="text-3xl">{pillar.icon}</span></div>
              <div><h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">XFree {pillar.name}</h1><p className="text-cyber-muted mt-1">{pillar.toolCount} tools</p></div>
            </div>
            <p className="text-cyber-text text-base leading-relaxed mb-4">{pillar.description}</p>
            <div className="flex flex-wrap gap-2">{(pillar.keywords || []).slice(0, 6).map(keyword => (<span key={keyword} className="px-2 py-1 rounded text-xs font-mono bg-cyber-surface border border-cyber-border text-cyber-muted">{keyword}</span>))}</div>
          </header>
          {pillarTools.length > 0 ? (
            <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Tools in this Guide</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pillarTools.map(tool => (
                  <Link key={tool.id} href={`/${locale}/tools/${tool.slug}`} className="cyber-card p-4 group block">
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">XFree {tool.title}</h3><p className="text-xs text-cyber-muted line-clamp-2 mb-3">{tool.shortDescription}</p><div className="flex items-center justify-between"><span className="text-[10px] text-cyber-dim font-mono">{tool.tags.slice(0, 3).join(', ')}</span><span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span></div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-12 cyber-card p-8 text-center"><p className="text-cyber-muted font-mono">More tools coming soon for this guide.</p></section>
          )}
          {relatedPillars.length > 1 && (
            <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Related Guides</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedPillars.filter(p => p.slug !== pillar.slug).slice(0, 6).map(related => (
                  <Link key={related.slug} href={`/${locale}/guides/${related.slug}`} className="cyber-card p-4 group block">
                    <div className="flex items-center gap-3"><span className="text-2xl">{related.icon}</span><div><h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono">XFree {related.name}</h3><p className="text-xs text-cyber-muted mt-1">{related.toolCount} tools</p></div></div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
