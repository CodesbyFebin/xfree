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
  return { title: `XFree Contact | Get in Touch`, description: 'Contact XFree for support, feedback, or partnerships.', keywords: ['XFree contact', 'support', 'feedback', 'developer tools'], alternates: { canonical: `https://www.xfree.in/${locale}/contact` }, openGraph: { title: 'XFree Contact', description: 'Get in touch.', type: 'website', url: `https://www.xfree.in/${locale}/contact` } };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Contact', href: `/${locale}/contact` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> Contact XFree</h1><p className="text-cyber-muted max-w-2xl mx-auto">Get in touch with the XFree team for support, feedback, or partnerships.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Reach Out</h2><div className="cyber-card p-6 text-center"><p className="text-cyber-muted mb-4">Email us at <a href="mailto:hello@xfree.in" className="text-cyber-glow hover:underline">hello@xfree.in</a></p><p className="text-cyber-muted">Or open an issue on <a href="https://github.com/xfree-in/xfree" className="text-cyber-glow hover:underline" rel="noopener">GitHub</a></p></div></section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
