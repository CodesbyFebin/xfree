import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { Inter, JetBrains_Mono, Space_Grotesk, Caveat } from 'next/font/google';
import { AnalyticsWidgets } from '@/components/analytics/Widgets';
import { PWARegister } from '@/components/PWARegister';
import { routing, isRtl, type Locale } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
});

const OG_LOCALES: Record<Locale, string> = {
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
  ja: 'ja_JP',
  hi: 'hi_IN',
  ar: 'ar_AR',
  zh: 'zh_CN',
  ta: 'ta_IN',
  ml: 'ml_IN',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://www.xfree.in';
  // The real route for a locale's homepage is exactly "/es" (no
  // trailing slash) - appending one here would 308-redirect. Only the
  // default locale's homepage is genuinely "/" with a trailing slash.
  const path = locale === routing.defaultLocale ? '' : `/${locale}`;
  const canonicalHomeUrl = locale === routing.defaultLocale ? `${baseUrl}/` : `${baseUrl}${path}`;

  const languages: Record<string, string> = { 'x-default': `${baseUrl}/` };
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? `${baseUrl}/` : `${baseUrl}/${l}`;
  }

  return {
    metadataBase: new URL(baseUrl),
    applicationName: 'XFree App',
    title: {
      default: 'XFree App: Free Developer, SEO & AI Tools',
      template: 'XFree: %s',
    },
    description:
      'XFree is a free online app for developer, SEO, and AI tools — no signup required. JSON formatters, HTML minifiers, and crypto utilities that run 100% client-side in your browser.',
    authors: [{ name: 'XFree Contributors' }],
    creator: 'XFree',
    publisher: 'XFree',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalHomeUrl,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: 'XFree',
      title: 'XFree App: Free Developer, SEO & AI Tools',
      description:
        'XFree is a free online app for developer, SEO, and AI tools — no signup required. JSON formatters, HTML minifiers, and crypto utilities that run 100% client-side in your browser.',
      url: canonicalHomeUrl,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'XFree developer tools interface with neon green terminal aesthetic',
        },
      ],
      locale: OG_LOCALES[locale as Locale] ?? OG_LOCALES.en,
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@xfreein',
      creator: '@xfreein',
      title: 'XFree App: Free Developer, SEO & AI Tools',
      description: 'A free online app for developer, SEO, and AI tools — no signup required. 100% client-side.',
      images: ['/twitter-image'],
    },
    icons: {
      icon: [
        { url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' },
      ],
      apple: [
        { url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' },
      ],
    },
  };
}

// Site-wide structured data. Kept minimal and factual: no invented build
// metadata (a prior version of this file shipped a placeholder
// buildCommit/buildTimestamp and a codeRepository URL pointing at a repo
// that isn't this one — both removed) and no links to routes that don't
// exist (a "Categories" breadcrumb previously pointed at /dev-tools,
// which matches no real route; fixed to /categories).
function getSchemaData(locale: string) {
  const baseUrl = 'https://www.xfree.in';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'XFree',
        alternateName: ['XFree.in', 'xfree.in'],
        url: `${baseUrl}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/favicon-512x512.png`,
          width: 512,
          height: 512,
        },
        description: 'XFree develops free browser-based developer, SEO, and single-purpose AI micro-tools.',
      },
      {
        '@type': ['WebSite', 'WebApplication'],
        '@id': `${baseUrl}/#website`,
        name: 'XFree',
        alternateName: ['XFree.in', 'xfree.in'],
        url: `${baseUrl}/`,
        description: 'Free browser-based developer, SEO, and single-purpose AI micro-tools.',
        inLanguage: locale,
        applicationCategory: 'Utilities',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${baseUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${baseUrl}/categories` },
          { '@type': 'ListItem', position: 3, name: 'Pillar Hubs', item: `${baseUrl}/pillars` },
        ],
      },
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      dir={isRtl(locale as Locale) ? 'rtl' : 'ltr'}
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} ${caveat.variable}`}
    >
      <head>
        {/* Sets data-theme before hydration/paint so the light theme
            doesn't flash dark first (or vice versa) - must stay inline,
            not a useEffect, since that would run after first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('xfree-theme');if(t==='light')document.documentElement.dataset.theme='light';}catch(e){}`,
          }}
        />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagservices.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com; img-src 'self' data: https:; connect-src 'self' https://api.github.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" />
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
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
        <link rel="alternate" type="text/plain" title="XFree llms.txt" href="/llms.txt" />
        <link rel="alternate" type="application/rss+xml" title="XFree Tools RSS Feed" href="/rss/tools.xml" />
        <link rel="alternate" type="application/rss+xml" title="XFree Guides RSS Feed" href="/rss/guides.xml" />
        <link rel="alternate" type="application/rss+xml" title="XFree Updates RSS Feed" href="/rss/updates.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getSchemaData(locale)) }}
        />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        <NextIntlClientProvider>
          {children}
          <AnalyticsWidgets />
          <PWARegister />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
