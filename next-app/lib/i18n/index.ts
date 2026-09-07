export const LOCALES = ['en', 'es', 'fr', 'pt', 'de', 'ja'] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_METADATA: Record<Locale, { name: string; lang: string }> = {
  en: { name: 'English', lang: 'en-US' },
  es: { name: 'Español', lang: 'es-ES' },
  fr: { name: 'Français', lang: 'fr-FR' },
  pt: { name: 'Português', lang: 'pt-BR' },
  de: { name: 'Deutsch', lang: 'de-DE' },
  ja: { name: '日本語', lang: 'ja-JP' },
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  pt: 'PT',
  de: 'DE',
  ja: 'JA',
};
