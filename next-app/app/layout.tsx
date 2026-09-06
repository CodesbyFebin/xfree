import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
import { AnalyticsWidgets } from '@/components/analytics/Widgets';
import './globals.css';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xfree.in'),
  applicationName: 'XFree App',
  title: {
    default: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    template: 'XFree: %s',
  },
  description:
    'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, XFree JSON formatters, XFree HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
  keywords: [
    'XFree app',
    'XFree online tools',
    'XFree developer tools',
    'XFree SEO utilities',
    'XFree free tools no signup',
    'XFree privacy-first tools',
    'XFree offline web tools',
    'XFree JSON formatter online',
    'XFree HTML minifier free',
    'XFree Base64 encoder decoder',
    'XFree JWT decoder tool',
    'XFree UUID v4 generator',
    'XFree password generator secure',
    'XFree Markdown previewer',
    'XFree SHA256 hash generator',
    'XFree CSS minifier',
    'XFree XML to JSON converter',
    'free developer tools',
    'privacy tools online',
    'no signup developer tools',
  ],
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
    canonical: '/',
    languages: {
      en: 'https://www.xfree.in/',
      es: 'https://www.xfree.in/es/',
      fr: 'https://www.xfree.in/fr/',
      pt: 'https://www.xfree.in/pt/',
      de: 'https://www.xfree.in/de/',
      ja: 'https://www.xfree.in/ja/',
      'x-default': 'https://www.xfree.in/',
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'XFree',
    title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    description:
      'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
    url: 'https://www.xfree.in/',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'XFree developer tools interface with neon green terminal aesthetic',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['es_ES', 'fr_FR', 'pt_BR', 'de_DE', 'ja_JP'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@xfreein',
    creator: '@xfreein',
    title: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    description: 'XFree is the ultimate free online app for developers. Privacy-first tools. 100% client-side, no signup.',
    images: ['/twitter-image'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
  assets: ['https://www.xfree.in/'],
  icons: {
    icon: [
      { url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' },
    ],
    apple: [
      { url: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%2300ff41%22>⚡</text></svg>' },
    ],
  },
};

const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.xfree.in/#organization',
      name: 'XFree',
      alternateName: ['XFree.in', 'xfree.in'],
      url: 'https://www.xfree.in/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.xfree.in/favicon-512x512.png',
        width: 512,
        height: 512,
      },
      description: 'XFree develops free browser-based developer, SEO, and single-purpose AI micro-tools.',
      sameAs: [],
    },
    {
      '@type': ['WebSite', 'WebApplication'],
      '@id': 'https://www.xfree.in/#website',
      name: 'XFree',
      alternateName: ['XFree.in', 'xfree.in'],
      url: 'https://www.xfree.in/',
      description: 'Free browser-based developer, SEO, and single-purpose AI micro-tools.',
      inLanguage: 'en',
      applicationCategory: 'Utilities',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: { '@id': 'https://www.xfree.in/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.xfree.in/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'XFree App',
      url: 'https://www.xfree.in/',
      description:
        'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (Browser-based)',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Privacy-First Developer Tools',
        '100% Client-Side Execution',
        'Zero Telemetry',
        'Open Source MIT',
        'No Account Required',
        'Offline Capable',
        'Privacy-First Architecture',
        'WebAssembly Optimized',
        'Military-Grade CSP Security',
        'Streaming File Parser',
      ],
      author: {
        '@type': 'Organization',
        name: 'XFree Contributors',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.xfree.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Categories',
          item: 'https://www.xfree.in/dev-tools',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Pillar Hubs',
          item: 'https://www.xfree.in/pillars',
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is XFree app?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'XFree app is the ultimate free online platform for developers offering privacy-first micro-tools including XFree JSON formatters, XFree HTML minifiers, XFree SEO utilities, and XFree crypto tools. All tools run 100% client-side with no signup required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is XFree really free with no signup?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. XFree is completely free to use with no sign-up, no account creation, and no usage limits. All tools are open-source under the MIT License and run entirely in your browser. There are no premium tiers, no hidden fees, and no paywalls.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does XFree ensure privacy?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'XFree tools run in Local Mode by default, processing your data inside your browser session using JavaScript and WebAssembly. Your input is never transmitted to external servers unless clearly disclosed. XFree uses a military-grade Content Security Policy (CSP), native Web Crypto API, and zero tracking scripts.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is XFree alternative to CodeBeautify?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'XFree is a privacy-first alternative to CodeBeautify and similar tools. Unlike those platforms, XFree runs 100% client-side with zero tracking, no ads on tool pages, no data collection, and open-source code you can audit. Try the XFree JSON Formatter online or use the XFree HTML minifier.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use XFree offline?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Because XFree tools are static HTML with embedded JavaScript, you can save any tool page and use it completely offline without an internet connection. XFree offline web tools work anywhere, including on airplanes and in secure environments.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is XFree open source?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The entire XFree codebase is open-source under the MIT License. You can audit, fork, and contribute on our GitHub repository at github.com/xfree-in/xfree. All contributions go through automated security scanning before deployment.',
          },
        },
        {
          '@type': 'Question',
          name: 'How many tools are on XFree?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'XFree currently publishes a growing catalog organized across approved pillar categories and topic clusters. The exact count of published tools is displayed dynamically on the homepage and updates as new tools pass the build gate.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is XFree JSON formatter online?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The XFree JSON Formatter online is a free, privacy-first tool that beautifies, minifies, validates, and repairs JSON data instantly in your browser. No data leaves your device. Part of the XFree app suite of developer tools.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      codeRepository: 'https://github.com/xfree-in/xfree',
      version: '1.0.0',
      buildCommit: 'a1b2c3d4e5f6',
      buildTimestamp: '2025-01-24T12:00:00Z',
      license: 'https://opensource.org/licenses/MIT',
      programmingLanguage: ['JavaScript', 'TypeScript'],
      runtimePlatform: 'Browser (Client-Side)',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        {children}
        <AnalyticsWidgets />
      </body>
    </html>
  );
}
