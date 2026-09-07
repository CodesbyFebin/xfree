import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PILLARS } from '@/lib/data/pillars';
import { USER_TESTIMONIALS, USE_CASES, FAQ_DATA, STATISTICS } from '@/lib/data/content';
import { generateSoftwareApplicationSchema, generateFAQSchema, generateHowToSchema, generateBreadcrumbSchema } from '@/lib/schema';
import { Locale, LOCALES, getDictionary } from '@/lib/i18n';
import { InteractiveHero } from '@/components/home/InteractiveHero';

interface Props { params: { locale: string } | Promise<{ locale: string }>; }

export async function generateStaticParams() { return LOCALES.map(locale => ({ locale })); }

async function resolveParams(params: Props['params']) {
  return params instanceof Promise ? await params : params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await resolveParams(params);
  return {
    title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    description: 'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
    keywords: ['XFree app', 'XFree online tools', 'XFree developer tools', 'XFree SEO utilities', 'XFree free tools no signup', 'XFree privacy-first tools', 'XFree offline web tools', 'XFree JSON formatter online', 'XFree HTML minifier free', 'XFree Base64 encoder decoder', 'XFree JWT decoder tool', 'XFree UUID v4 generator', 'XFree password generator secure', 'XFree Markdown previewer', 'XFree SHA256 hash generator', 'XFree CSS minifier', 'XFree XML to JSON converter', 'free developer tools', 'privacy tools online', 'no signup developer tools'],
    alternates: { canonical: `https://www.xfree.in/${locale}/`, languages: Object.fromEntries(LOCALES.map(l => [l, `https://www.xfree.in/${l}/`])) },
    openGraph: { type: 'website', siteName: 'XFree', title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup', description: 'XFree is the ultimate free online app for developers.', url: `https://www.xfree.in/${locale}/`, images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'XFree developer tools interface' }], locale: locale, alternateLocale: LOCALES.filter(l => l !== locale) },
    twitter: { card: 'summary_large_image', site: '@xfreein', creator: '@xfreein', title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup', description: 'XFree is the ultimate free online app for developers.', images: ['/twitter-image'] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
    verification: { google: 'google-site-verification-code' },
    icons: { icon: [{ url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' }], apple: [{ url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' }] },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  const schema = generateSoftwareApplicationSchema();
  const faqSchema = generateFAQSchema(FAQ_DATA);
  const howToSchema = generateHowToSchema('XFree Tools', ['Select a tool', 'Enter your data', 'Get instant results']);
  const breadcrumbSchema = generateBreadcrumbSchema([{ name: 'Home', href: `/${locale}` }]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="scanlines" aria-hidden="true" />
      <Header dict={dict} locale={currentLocale} />
      <main id="main-content" className="pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Breadcrumbs items={[{ name: 'Home', href: `/${locale}` }]} />
          <InteractiveHero pillars={PILLARS} locale={currentLocale} dict={dict} />
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="cyber-card p-4 text-center"><div className="text-2xl font-black text-cyber-glow font-mono">{STATISTICS.tools}</div><div className="text-xs text-cyber-muted font-mono mt-1">{dict.hero.stats.tools}</div></div>
            <div className="cyber-card p-4 text-center"><div className="text-2xl font-black text-cyber-glow font-mono">{STATISTICS.pillars}</div><div className="text-xs text-cyber-muted font-mono mt-1">{dict.hero.stats.pillars}</div></div>
            <div className="cyber-card p-4 text-center"><div className="text-2xl font-black text-cyber-glow font-mono">{dict.hero.stats.languages}</div><div className="text-xs text-cyber-muted font-mono mt-1">Languages</div></div>
            <div className="cyber-card p-4 text-center"><div className="text-2xl font-black text-cyber-glow font-mono">{dict.hero.stats.privacy}</div><div className="text-xs text-cyber-muted font-mono mt-1">Architecture</div></div>
          </section>
          <section className="mb-16"><h2 className="text-2xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> {dict.nav.pillars}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PILLARS.slice(0, 9).map(pillar => (
                <Link key={pillar.slug} href={`/${locale}/pillars/${pillar.slug}`} className="cyber-card p-4 group block">
                  <div className="flex items-start gap-3"><span className="text-2xl">{pillar.icon}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span><span className="text-[10px] text-cyber-dim font-mono">hub</span></div><h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono truncate">XFree {pillar.name}</h3><p className="text-xs text-cyber-muted mt-1 line-clamp-2">{pillar.description}</p><span className="text-[10px] text-cyber-dim font-mono mt-2 block">{pillar.toolCount} tools</span></div></div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6"><Link href={`/${locale}/pillars`} className="text-cyber-glow text-sm font-mono hover:underline">{dict.pillars.viewAll} →</Link></div>
          </section>
          <section className="mb-16"><h2 className="text-2xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> What Users Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {USER_TESTIMONIALS.slice(0, 6).map(t => (
                <div key={t.id} className="cyber-card p-5"><div className="flex items-center gap-1 mb-2">{[...Array(t.rating)].map((_, i) => (<span key={i} className="text-cyber-glow text-sm">★</span>))}</div><p className="text-sm text-cyber-muted italic">&ldquo;{t.content}&rdquo;</p><p className="text-xs text-cyber-dim mt-2">— {t.name}, {t.role}</p></div>
              ))}
            </div>
          </section>
          <section className="mb-16"><h2 className="text-2xl font-bold text-white font-mono mb-6"><span className="text-cyber-glow">$</span> FAQ</h2>
            <div className="space-y-4">{FAQ_DATA.slice(0, 6).map((faq, i) => (<div key={i} className="cyber-card p-5"><h3 className="text-sm font-semibold text-white font-mono mb-2">{faq.question}</h3><p className="text-sm text-cyber-muted">{faq.answer}</p></div>))}</div>
          </section>
        </div>
      </main>
      <Footer dict={dict} locale={locale as Locale} />
    </>
  );
}
