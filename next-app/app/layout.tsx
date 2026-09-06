import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';
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
  title: {
    default: 'XFree App: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    template: '%s | XFree App',
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
    'XFree SHA256 hash generator',
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
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'XFree',
    title: 'XFree App: Free Developer, SEO & Privacy Micro-Tools | No Signup',
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
    title: 'XFree App: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    description: 'XFree is the ultimate free online app for developers. Privacy-first tools. 100% client-side, no signup.',
    images: ['/twitter-image'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' fill='%2300ff41'>⚡</text></svg>" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' fill='%2300ff41'>⚡</text></svg>" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="ai:manifest" href="/ai.txt" />
        <link rel="llms" href="/llms.txt" />
        <link rel="llms-full" href="/llms-full.txt" />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
