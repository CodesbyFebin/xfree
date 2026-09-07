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
  return { title: `XFree About | Privacy-First Developer Tools`, description: 'Learn about XFree, the privacy-first free developer tools platform.', keywords: ['XFree about', 'privacy-first tools', 'free developer tools'], alternates: { canonical: `https://www.xfree.in/${locale}/about` }, openGraph: { title: 'XFree About', description: 'Learn about XFree.', type: 'website', url: `https://www.xfree.in/${locale}/about` } };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const breadcrumbItems = [{ name: 'Home', href: `/${locale}` }, { name: 'About', href: `/${locale}/about` }];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <header className="text-center mb-12"><h1 className="text-3xl sm:text-4xl font-black text-white font-mono mb-4"><span className="text-cyber-glow">$</span> About XFree</h1><p className="text-cyber-muted max-w-2xl mx-auto">XFree is a privacy-first platform offering free browser-based developer, SEO, and AI micro-tools. All tools run 100% client-side with no signup required.</p></header>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Our Mission</h2><p className="text-cyber-text text-base leading-relaxed">We believe developer tools should be free, private, and accessible. XFree runs entirely in your browser — your data never leaves your device.</p></section>
          <section className="mb-12"><h2 className="text-xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔒 Privacy-First</h3><p className="text-xs text-cyber-muted">All tools run 100% in your browser. Your data never leaves your device.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">⚡ Instant Results</h3><p className="text-xs text-cyber-muted">Get formatted, validated, or converted output immediately without waiting or server processing.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">💯 100% Free</h3><p className="text-xs text-cyber-muted">No signup, no usage limits, no premium tiers. All tools are completely free forever.</p></div>
              <div className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">🔗 Interconnected</h3><p className="text-xs text-cyber-muted">Tools link to related tools for seamless workflows and better results.</p></div>
            </div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
