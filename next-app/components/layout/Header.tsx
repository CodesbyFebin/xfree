'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Menu, X } from 'lucide-react';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

// Category hrefs verified against lib/data/tools.ts's CATEGORIES.slug (what
// app/[locale]/categories/[category]/page.tsx actually matches against).
const NAV_ITEMS = [
  {
    labelKey: 'toolsMenu',
    href: '/pillars',
    children: [
      { labelKey: 'allPillars', href: '/pillars' },
      { labelKey: 'developerTools', href: '/categories/developer-tools' },
      { labelKey: 'seoTools', href: '/categories/seo-url-tools' },
      { labelKey: 'aiTools', href: '/categories/ai-tools' },
      { labelKey: 'securityTools', href: '/categories/security-tools' },
    ],
  },
  {
    labelKey: 'resourcesMenu',
    href: '/guides',
    children: [
      { labelKey: 'allGuides', href: '/guides' },
      { labelKey: 'faq', href: '/faq' },
      { labelKey: 'howItWorks', href: '/how-it-works' },
      { labelKey: 'useCases', href: '/use-cases' },
    ],
  },
  {
    labelKey: 'aboutMenu',
    href: '/about',
    children: [
      { labelKey: 'aboutXfree', href: '/about' },
      { labelKey: 'security', href: '/security' },
      { labelKey: 'roadmap', href: '/roadmap' },
      { labelKey: 'xfreeApp', href: '/xfree-app' },
    ],
  },
] as const;

export function Header() {
  const t = useTranslations('Header');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close on navigation - without this, a link tap inside the mobile menu
  // would leave it open over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    // Move focus into the open menu so keyboard users land somewhere
    // useful, rather than leaving focus on a now-hidden-behind-overlay button.
    const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>('a, button');
    firstLink?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  return (
    <header
      id="mainNav"
      className={`sticky-nav fixed top-0 left-0 right-0 z-50 px-4 py-3 ${
        scrolled ? 'scrolled' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="XFree homepage">
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
            <NavDropdown
              key={item.labelKey}
              label={t(item.labelKey)}
              links={item.children.map((c) => ({ href: c.href, label: t(c.labelKey) }))}
            />
          ))}
          <Link
            href="/contact"
            className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all"
          >
            {t('contact')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>
          <Link
            href="/pillars"
            className="hidden lg:inline-flex cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
          >
            <span>{t('allTools')}</span>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="lg:hidden p-2 text-cyber-text hover:text-cyber-glow"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          ref={mobileMenuRef}
          className="lg:hidden max-w-7xl mx-auto mt-3 pt-3 border-t border-cyber-border max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          <nav aria-label="Main navigation" className="flex flex-col gap-1 pb-2">
            {NAV_ITEMS.map((item) => (
              <div key={item.labelKey} className="mb-2">
                <Link href={item.href} className="block px-2 py-2 text-sm font-semibold text-cyber-text">
                  {t(item.labelKey)}
                </Link>
                <div className="flex flex-col pl-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="px-2 py-2 text-sm text-cyber-muted hover:text-cyber-glow"
                    >
                      {t(child.labelKey)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link href="/contact" className="px-2 py-2 text-sm font-semibold text-cyber-text">
              {t('contact')}
            </Link>
            <div className="flex items-center gap-3 px-2 pt-3 sm:hidden">
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavDropdown({ label, links }: { label: string; links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="nav-dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="px-3 py-1.5 text-sm text-cyber-muted hover:text-cyber-glow rounded font-mono transition-all flex items-center gap-1" aria-haspopup="true" aria-expanded={open}>
        {label} <span aria-hidden="true">▾</span>
      </button>
      {/* Always rendered — visibility is CSS-driven (:hover/:focus-within on
          .nav-dropdown, see globals.css). */}
      <div className="nav-dropdown-menu" role="menu">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-dropdown-item" role="menuitem">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
