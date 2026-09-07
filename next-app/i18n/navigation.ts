import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware Link/redirect/usePathname/useRouter — Link automatically
// prefixes hrefs with the active locale (or omits the prefix for the
// default "en" locale, per routing.localePrefix: "as-needed").
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
