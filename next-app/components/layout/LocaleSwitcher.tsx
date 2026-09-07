'use client';

import { useLocale } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { locales, localeNames } from '@/i18n/routing';

// Locale-aware Link with an explicit `locale` prop swaps only the locale
// segment of the current URL, keeping the rest of the path (and its query
// string, via useLocale/usePathname's active-route context) intact.
export function LocaleSwitcher({ className = 'hidden xl:flex items-center gap-1' }: { className?: string }) {
  const activeLocale = useLocale();
  const pathname = usePathname();

  return (
    <div className={className} aria-label="Language switcher">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          className={`lang-switcher ${locale === activeLocale ? 'active' : ''}`}
          aria-current={locale === activeLocale ? 'true' : undefined}
        >
          {locale.toUpperCase()}
          <span className="sr-only"> ({localeNames[locale]})</span>
        </Link>
      ))}
    </div>
  );
}
