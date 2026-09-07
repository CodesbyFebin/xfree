'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// Category hrefs verified against lib/data/tools.ts's CATEGORIES.slug (what
// app/categories/[category]/page.tsx actually matches against) — two of
// these were previously wrong (/categories/dev-tools and /categories/seo-tools
// match no real category slug; the real ones are developer-tools and
// seo-url-tools).
const NAV_ITEMS = [
  {
    label: 'Tools',
    href: '/pillars',
    children: [
      { label: 'All Pillars', href: '/pillars' },
      { label: 'Developer Tools', href: '/categories/developer-tools' },
      { label: 'SEO Tools', href: '/categories/seo-url-tools' },
      { label: 'AI Tools', href: '/categories/ai-tools' },
      { label: 'Security Tools', href: '/categories/security-tools' },
    ],
  },
  {
    label: 'Resources',
    href: '/guides',
    children: [
      { label: 'All Guides', href: '/guides' },
      { label: 'FAQ', href: '/faq' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Use Cases', href: '/use-cases' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About XFree', href: '/about' },
      { label: 'Security', href: '/security' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'XFree App', href: '/xfree-app' },
    ],
  },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 ${
        scrolled ? 'scrolled' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="XFree homepage">
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size logo, next/image's srcset generation isn't a fit for a hand-built 1x/2x pair */}
          <picture className="shrink-0">
            <source srcSet="/logo-wordmark-80.webp 1x, /logo-wordmark-160.webp 2x" type="image/webp" />
            <img
              src="/logo-wordmark-80.png"
              srcSet="/logo-wordmark-80.png 1x, /logo-wordmark-160.png 2x"
              alt="XFree"
              width={160}
              height={80}
              decoding="async"
              style={{ height: '36px', width: '72px' }}
            />
          </picture>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative group">
              <Link
                href={item.href}
                className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all flex items-center gap-1"
              >
                {item.label}
                <span aria-hidden="true">▾</span>
              </Link>
              <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-cyber-surface border border-cyber-border rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block px-3 py-2 text-sm text-cyber-muted hover:text-cyber-glow hover:bg-cyber-glow/5 rounded transition-all"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link
            href="/contact"
            className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/pillars"
            className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
          >
            <span>All Tools</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
