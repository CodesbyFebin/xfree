import { Locale, LOCALES, getDictionary } from '@/lib/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Metadata } from 'next';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}

async function resolveParams(params: LocaleLayoutProps['params']) {
  return params instanceof Promise ? await params : params;
}

export async function generateStaticParams() {
  return LOCALES.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  return {
    title: dict.seo.pillarsTitle,
    description: dict.seo.pillarsDescription,
    alternates: {
      canonical: `https://www.xfree.in/${locale}`,
      languages: Object.fromEntries(LOCALES.map(l => [l, `https://www.xfree.in/${l}`])),
    },
    openGraph: { locale, alternateLocale: LOCALES.filter(l => l !== locale) },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await resolveParams(params);
  const dict = getDictionary(locale as Locale);
  const currentLocale = locale as Locale;
  return (
    <html lang={currentLocale} dir="ltr">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; img-src 'self' data: https:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="1 days" />
        <meta name="ai-content-format" content="markdown" />
        <meta name="ai-index" content="yes" />
        <meta name="theme-color" content="#050508" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="XFree App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.github.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="ai:manifest" href="/ai.txt" />
        <link rel="llms" href="/llms.txt" />
        <link rel="llms-full" href="/llms-full.txt" />
        <link rel="alternate" type="application/rss+xml" title="XFree RSS Feed" href={`/${currentLocale}/rss/feed.xml`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'XFree', url: `https://www.xfree.in/${currentLocale}/`, description: 'Free browser-based developer, SEO, and single-purpose AI micro-tools.', inLanguage: currentLocale, potentialAction: { '@type': 'SearchAction', target: `https://www.xfree.in/${currentLocale}/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }) }} />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        <Header dict={dict} locale={currentLocale} />
        <main id="main-content">{children}</main>
        <Footer dict={dict} locale={currentLocale} />
      </body>
    </html>
  );
}
