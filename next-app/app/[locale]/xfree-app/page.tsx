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
  return { title: `XFree App`, description: 'XFree app — free developer tools.', keywords: ['XFree app', 'developer tools', 'free tools'], alternates: { canonical: `https://www.xfree.in/${locale}/xfree-app` }, openGraph: { title: 'XFree App', description: 'XFree app.', type: 'website', url: `https://www.xfree.in/${locale}/xfree-app` } };
}

export default async function XFreeAppPage({ params }: Props) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'XFree App', href: `/${locale}/xfree-app` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree App</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree app — free developer tools.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">⚡ Fast</h3><p className="text-xs text-cyber-muted">Instant results with no server round-trip.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔒 Private</h3><p className="text-xs text-cyber-muted">All processing happens in your browser.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">💯 Free</h3><p className="text-xs text-cyber-muted">No signup, no limits, no premium tiers.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">📱 Responsive</h3><p className="text-xs text-cyber-muted">Works on desktop, tablet, and mobile.</p></div>
            </div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
