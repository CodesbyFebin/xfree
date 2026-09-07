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
  return { title: `XFree Security`, description: 'XFree security — military-grade CSP, zero telemetry.', keywords: ['XFree security', 'CSP', 'zero telemetry', 'privacy'], alternates: { canonical: `https://www.xfree.in/${locale}/security` }, openGraph: { title: 'XFree Security', description: 'Security.', type: 'website', url: `https://www.xfree.in/${locale}/security` } };
}

export default async function SecurityPage({ params }: Props) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'Security', href: `/${locale}/security` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> XFree Security</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree security — military-grade CSP, zero telemetry.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Security Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🛡️ CSP</h3><p className="text-xs text-cyber-muted">Military-grade Content Security Policy.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔒 COOP/COEP</h3><p className="text-xs text-cyber-muted">Cross-origin isolation for WebAssembly.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🚫 Zero Telemetry</h3><p className="text-xs text-cyber-muted">No tracking scripts, no analytics.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔐 Web Crypto</h3><p className="text-xs text-cyber-muted">Native Web Crypto API for encryption.</p></div>
            </div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
