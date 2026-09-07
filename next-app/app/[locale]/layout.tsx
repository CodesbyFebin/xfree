import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';
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

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_METADATA[locale] || LOCALE_METADATA.en;
  const canonical = buildCanonical('/', { language: locale });

  const languages: Record<string, string> = {};
  LOCALES.forEach((loc) => {
    languages[loc] = buildCanonical('/', { language: loc });
  });

  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: {
      default: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
      template: 'XFree: %s',
    },
    description:
      'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, XFree JSON formatters, XFree HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: 'XFree',
      title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
      description:
        'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
      url: canonical,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'XFree developer tools interface with neon green terminal aesthetic',
        },
      ],
      locale: meta.lang,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@xfreein',
      creator: '@xfreein',
      title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
      description: 'XFree is the ultimate free online app for developers. Privacy-first tools. 100% client-side, no signup.',
      images: ['/twitter-image'],
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable}`}
    >
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
        <link rel="alternate" type="application/rss+xml" title="XFree RSS Feed" href="/rss/feed.xml" />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
