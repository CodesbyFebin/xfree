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
  return { title: `XFree Terms of Service`, description: 'XFree terms of service.', keywords: ['XFree terms', 'terms of service', 'legal'], alternates: { canonical: `https://www.xfree.in/${locale}/terms` }, openGraph: { title: 'XFree Terms', description: 'Terms of service.', type: 'website', url: `https://www.xfree.in/${locale}/terms` } };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Terms', href: `/${locale}/terms` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> Terms of Service</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree terms of service.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Usage</h2><p className="text-cyber-text text-base leading-relaxed mb-4">XFree tools are provided free of charge for personal and commercial use. You may use them without restriction.</p><p className="text-cyber-text text-base leading-relaxed mb-4">XFree is provided "as is" without warranty of any kind. The developers are not liable for any damages arising from the use of these tools.</p></section>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Open Source</h2><p className="text-cyber-text text-base leading-relaxed">XFree is open-source software released under the MIT License. You may view, fork, and contribute to the codebase on GitHub.</p></section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
