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
  title: {
    default: 'XFree: Free Developer, SEO & Privacy Micro-Tools | No Signup',
    template: 'XFree: %s',
  },
  description:
    'XFree is the ultimate free online app for developers. Access privacy-first SEO tools, XFree JSON formatters, XFree HTML minifiers, and crypto utilities. 100% client-side, no signup required.',
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
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
