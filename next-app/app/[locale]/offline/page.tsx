import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: Promise<{ locale: string }>; }

export async function generateStaticParams() { return LOCALES.map(locale => ({ locale })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: `XFree Offline Mode`, description: 'Use XFree tools offline.', keywords: ['XFree offline', 'offline tools', 'offline mode'], alternates: { canonical: `https://www.xfree.in/${locale}/offline` }, openGraph: { title: 'XFree Offline', description: 'Offline mode.', type: 'website', url: `https://www.xfree.in/${locale}/offline` } };
}

export default async function OfflinePage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Offline', href: `/${locale}/offline` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree Offline Mode</h1><p className="text-cyber-muted max-w-2xl mx-auto">Use XFree tools offline.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> How It Works</h2><p className="text-cyber-text text-base leading-relaxed mb-4">XFree tools are static HTML with embedded JavaScript. You can save any tool page and use it completely offline without an internet connection.</p><p className="text-cyber-text text-base leading-relaxed mb-4">XFree offline web tools work anywhere, including on airplanes and in secure environments.</p></section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
