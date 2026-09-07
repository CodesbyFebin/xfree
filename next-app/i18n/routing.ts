import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'es', 'fr', 'de', 'ja', 'hi', 'ar', 'zh', 'ta', 'ml'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  hi: 'हिन्दी',
  ar: 'العربية',
  zh: '中文',
  ta: 'தமிழ்',
  ml: 'മലയാളം',
};

// Right-to-left locales - drives <html dir> in app/[locale]/layout.tsx.
export const rtlLocales: readonly Locale[] = ['ar'];
export function isRtl(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English stays unprefixed at "/" for continuity with the site's
  // existing indexed URLs; other locales are prefixed ("/es/...").
  localePrefix: 'as-needed',
});
