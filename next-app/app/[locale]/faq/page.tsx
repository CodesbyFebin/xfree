import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQ_DATA } from '@/lib/data/content';
import { generateFAQSchema, generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';

interface Props { params: Promise<{ locale: string }>; }

export async function generateStaticParams() { return LOCALES.map(locale => ({ locale })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: `XFree FAQ | Frequently Asked Questions`, description: 'Frequently asked questions about XFree free developer tools.', keywords: ['XFree FAQ', 'frequently asked questions', 'free tools', 'developer tools'], alternates: { canonical: `https://www.xfree.in/${locale}/faq` }, openGraph: { title: 'XFree FAQ', description: 'Frequently asked questions.', type: 'website', url: `https://www.xfree.in/${locale}/faq` } };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const schema = generateFAQSchema(FAQ_DATA);
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'FAQ', href: `/${locale}/faq` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree FAQ</h1><p className="text-cyber-muted max-w-2xl mx-auto">Frequently asked questions about XFree free developer tools.</p></header>
          <div className="space-y-4">{FAQ_DATA.map((faq, i) => (<div key={i} className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">{faq.question}</h3><p className="text-sm text-cyber-muted">{faq.answer}</p></div>))}</div>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
