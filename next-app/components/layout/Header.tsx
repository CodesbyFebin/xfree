'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  {
    label: 'XFree Dev & Data',
    href: '/categories/dev-tools',
    children: [
      { label: 'Developer Tools', href: '/categories/dev-tools' },
      { label: 'JSON & Data Tools', href: '/categories/json-data-tools' },
      { label: 'Code Formatting', href: '/categories/code-formatting' },
      { label: 'API Tools', href: '/categories/api-tools' },
      { label: 'Regex Tools', href: '/categories/regex-tools' },
    ],
  },
  {
    label: 'XFree Web & SEO',
    href: '/categories/seo-tools',
    children: [
      { label: 'SEO Tools', href: '/categories/seo-tools' },
      { label: 'Schema Tools', href: '/categories/schema-tools' },
      { label: 'Meta Tag Generator', href: '/tools/meta-tag-generator' },
      { label: 'Sitemap Generator', href: '/tools/xml-sitemap-generator' },
    ],
  },
  {
    label: 'XFree Security',
    href: '/categories/security-tools',
    children: [
      { label: 'Security Tools', href: '/categories/security-tools' },
      { label: 'JWT Decoder', href: '/tools/jwt-decoder' },
      { label: 'Hash Generator', href: '/tools/hash-generator' },
      { label: 'Password Generator', href: '/tools/password-generator' },
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
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="XFree homepage"
        >
          <div className="w-9 h-9 rounded-lg border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 group-hover:bg-cyber-glow/10 transition-all neon-box-green">
            <span className="text-sm font-black text-cyber-glow tracking-tighter font-cyber">
              X
            </span>
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">
              XFree<span className="text-cyber-glow">.in</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-cyber-muted font-mono ml-2">
              // XFree App · Free Developer Tools
            </span>
          </div>
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
            href="/pillars"
            className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all"
          >
            Pillars
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://app.xfree.in/"
            className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
            rel="noopener"
          >
            <span>Launch Studio →</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
