import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'es', 'fr', 'de', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English stays unprefixed at "/" for continuity with the site's
  // existing indexed URLs; other locales are prefixed ("/es/...").
  localePrefix: 'as-needed',
});
