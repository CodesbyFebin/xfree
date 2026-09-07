import { Locale, LocaleDict } from './types';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { pt } from './pt';
import { de } from './de';
import { ja } from './ja';

const dictionaries: Record<Locale, LocaleDict> = {
  en,
  es,
  fr,
  pt,
  de,
  ja,
};

export function getDictionary(locale: Locale): LocaleDict {
  return dictionaries[locale] ?? dictionaries.en;
}

export function isValidLocale(locale: string): locale is Locale {
  return locale in dictionaries;
}

export const LOCALES: Locale[] = ['en', 'es', 'fr', 'pt', 'de', 'ja'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  ja: '日本語',
};

export type { Locale, LocaleDict };