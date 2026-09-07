import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PILLARS, findPillarBySlug } from '@/lib/data/pillars';
import { TOOLS, findToolById } from '@/lib/data/toolsWithSEO';
import { buildCanonical } from '@/lib/canonical';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: Promise<{ locale: string; category: string }>; }

export async function generateStaticParams() {
  const params: { locale: string; category: string }[] = [];
  LOCALES.forEach(locale => {
    PILLARS.forEach(pillar => {
      params.push({ locale, category: pillar.category });
    });
  });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const dict = getDictionary(locale as Locale);
  const categoryInfo = PILLARS.find(p => p.category === category);
  return { title: `XFree ${categoryInfo?.name || category} | Tools`, description: categoryInfo?.description || `XFree ${category} tools`, keywords: ['XFree', category, 'tools', 'free'], alternates: { canonical: buildCanonical(`/categories/${category}`, { language: locale }) }, openGraph: { title: `XFree ${categoryInfo?.name || category}`, description: categoryInfo?.description || `XFree ${category} tools`, type: 'website', url: buildCanonical(`/categories/${category}`, { language: locale }) } };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const categoryPillars = PILLARS.filter(p => p.category === category);
  const categoryTools = TOOLS.filter(t => t.category === category && t.indexable);
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Categories', href: `/${locale}/categories` }, { name: category, href: `/${locale}/categories/${category}` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree {category}</h1><p className="text-cyber-muted max-w-2xl mx-auto">{categoryTools.length} free tools in this category.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTools.map(tool => (
                <Link key={tool.id} href={`/${locale}/tools/${tool.slug}`} className="cyber-card p-4 group block">
                  <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono mb-1">XFree {tool.title}</h3><p className="text-xs text-cyber-muted line-clamp-2 mb-3">{tool.shortDescription}</p><div className="flex items-center justify-between"><span className="text-[10px] text-cyber-dim font-mono">{tool.tags.slice(0, 3).join(', ')}</span><span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">USE FREE →</span></div>
                </Link>
              ))}
            </div>
          </section>
          {categoryPillars.length > 0 && (
            <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Pillars</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPillars.map(pillar => (
                  <Link key={pillar.slug} href={`/${locale}/pillars/${pillar.slug}`} className="cyber-card p-4 group block">
                    <div className="flex items-start gap-3"><span className="text-2xl">{pillar.icon}</span><div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono truncate">XFree {pillar.name}</h3><p className="text-xs text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p><span className="text-[10px] text-cyber-dim font-mono mt-2 block">{pillar.toolCount} tools</span></div></div>
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
