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
  return { title: `XFree Privacy Policy`, description: 'XFree privacy policy — your data stays on your device.', keywords: ['XFree privacy', 'privacy policy', 'data protection'], alternates: { canonical: `https://www.xfree.in/${locale}/privacy` }, openGraph: { title: 'XFree Privacy', description: 'Privacy policy.', type: 'website', url: `https://www.xfree.in/${locale}/privacy` } };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Privacy', href: `/${locale}/privacy` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> Privacy Policy</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree privacy policy — your data stays on your device.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Data Handling</h2><p className="text-cyber-text text-base leading-relaxed mb-4">XFree tools run 100% client-side in your browser. Your input data never leaves your device unless you explicitly choose to share it.</p><p className="text-cyber-text text-base leading-relaxed mb-4">We do not collect, store, or transmit your data to any server. All processing happens locally using JavaScript and WebAssembly.</p></section>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Cookies</h2><p className="text-cyber-text text-base leading-relaxed">XFree does not use cookies for tracking or analytics. Essential cookies may be used for session management only.</p></section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
