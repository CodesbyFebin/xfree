'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Locale, LOCALES, LOCALE_LABELS } from '@/lib/i18n';

interface HeaderProps {
  dict: {
    nav: {
      home: string;
      tools: string;
      pillars: string;
      guides: string;
      faq: string;
      about: string;
      contact: string;
      roadmap: string;
      useCases: string;
    };
    common: {
      language: string;
    };
  };
  locale: Locale;
}

const NAV_ITEMS = [
  {
    label: 'tools',
    href: '/pillars',
    children: [
      { label: 'All Pillars', href: '/pillars' },
      { label: 'Developer Tools', href: '/categories/dev-tools' },
      { label: 'SEO Tools', href: '/categories/seo-tools' },
      { label: 'AI Tools', href: '/categories/ai-tools' },
      { label: 'Security Tools', href: '/categories/security-tools' },
    ],
  },
  {
    label: 'resources',
    href: '/guides',
    children: [
      { label: 'All Guides', href: '/guides' },
      { label: 'FAQ', href: '/faq' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Use Cases', href: '/use-cases' },
    ],
  },
  {
    label: 'about',
    href: '/about',
    children: [
      { label: 'About XFree', href: '/about' },
      { label: 'Security', href: '/security' },
      { label: 'Roadmap', href: '/roadmap' },
      { label: 'XFree App', href: '/xfree-app' },
    ],
  },
];

export function Header({ dict, locale }: HeaderProps) {
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
          href={`/${locale}`}
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
              Free Developer Tools
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative group">
              <Link
                href={`/${locale}${item.href}`}
                className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all flex items-center gap-1"
              >
                {dict.nav[item.label as keyof typeof dict.nav]}
                <span aria-hidden="true">▾</span>
              </Link>
              <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-cyber-surface border border-cyber-border rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={`/${locale}${child.href}`}
                    className="block px-3 py-2 text-sm text-cyber-muted hover:text-cyber-glow hover:bg-cyber-glow/5 rounded transition-all"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link
            href={`/${locale}/contact`}
            className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all"
          >
            {dict.nav.contact}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all flex items-center gap-1"
              aria-label={dict.common.language}
            >
              {locale.toUpperCase()}
              <span aria-hidden="true">▾</span>
            </button>
            <div className="absolute top-full right-0 mt-2 min-w-[120px] bg-cyber-surface border border-cyber-border rounded-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50">
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  href={`/${l}`}
                  className="block px-3 py-2 text-sm text-cyber-muted hover:text-cyber-glow hover:bg-cyber-glow/5 rounded transition-all"
                >
                  {LOCALE_LABELS[l]}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href={`/${locale}/pillars`}
            className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
          >
            <span>{dict.nav.tools}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}