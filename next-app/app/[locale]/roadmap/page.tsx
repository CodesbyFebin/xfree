import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: { locale: string } | Promise<{ locale: string }>; }

export async function generateStaticParams() { return LOCALES.map(locale => ({ locale })); }

async function resolveParams(params: Props['params']) {
  return params instanceof Promise ? await params : params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveParams(params);
  return { title: `XFree Roadmap | Product Direction`, description: 'XFree roadmap and product direction.', keywords: ['XFree roadmap', 'product direction', 'developer tools'], alternates: { canonical: `https://www.xfree.in/${locale}/roadmap` }, openGraph: { title: 'XFree Roadmap', description: 'Product direction.', type: 'website', url: `https://www.xfree.in/${locale}/roadmap` } };
}

export default async function RoadmapPage({ params }: Props) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Roadmap', href: `/${locale}/roadmap` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree Roadmap</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree product direction and upcoming features.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Upcoming</h2>
            <div className="space-y-4">
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔜 More Tools</h3><p className="text-xs text-cyber-muted">Expanding the tool catalog with new utilities every week.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔜 API Access</h3><p className="text-xs text-cyber-muted">Programmatic access to XFree tools for automation workflows.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔜 Mobile App</h3><p className="text-xs text-cyber-muted">Native mobile experience for on-the-go tool access.</p></div>
            </div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
