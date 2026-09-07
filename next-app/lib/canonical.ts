const BASE_URL = 'https://www.xfree.in';

export interface CanonicalOptions {
  language?: string;
  trailingSlash?: boolean;
  version?: string;
}

export function buildCanonical(
  path: string,
  options: CanonicalOptions = {}
): string {
  const { language = 'en', trailingSlash = false } = options;

  let canonicalPath = path.startsWith('/') ? path : `/${path}`;

  if (trailingSlash && !canonicalPath.endsWith('/')) {
    canonicalPath += '/';
  }

  const langPrefix = language !== 'en' ? `/${language}` : '';

  if (canonicalPath === '/' && language !== 'en') {
    return `${BASE_URL}${langPrefix}`;
  }

  return `${BASE_URL}${langPrefix}${canonicalPath}`;
}

export function buildHreflang(
  path: string,
  languages: string[] = ['en', 'es', 'fr', 'pt', 'de', 'ja']
): Array<{ lang: string; href: string }> {
  return languages.map((lang) => ({
    lang,
    href: buildCanonical(path, { language: lang }),
  }));
}

export function isCanonicalDuplicate(
  currentUrl: string,
  paths: string[]
): boolean {
  const normalizedCurrent = currentUrl.toLowerCase().replace(/\/+$/, '');
  return paths.some(p => {
    const normalized = p.toLowerCase().replace(/\/+$/, '');
    return normalized !== normalizedCurrent && normalized === `${normalizedCurrent}/`;
  });
}
