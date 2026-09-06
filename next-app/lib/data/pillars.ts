import { PillarDefinition } from '@/types';

export const PILLARS: PillarDefinition[] = [
  {
    slug: 'dev-tools',
    num: '01',
    name: 'XFree Developer Tools',
    description: 'JSON formatters, regex testers, code validators, and developer utilities for everyday tasks.',
    icon: '⚡',
    color: 'glow',
    category: 'developer',
  },
  {
    slug: 'json-data-tools',
    num: '02',
    name: 'XFree JSON & Data Tools',
    description: 'JSON validators, formatters, converters to YAML, CSV, XML for data engineers.',
    icon: '{}',
    color: 'glow',
    category: 'developer',
  },
  {
    slug: 'seo-tools',
    num: '03',
    name: 'XFree SEO Tools',
    description: 'Meta tag generators, sitemap creators, robots.txt editors for digital marketers.',
    icon: '🌐',
    color: 'cyan',
    category: 'seo',
  },
  {
    slug: 'security-tools',
    num: '04',
    name: 'XFree Security Tools',
    description: 'Hash generators, JWT decoders, password generators for cybersecurity professionals.',
    icon: '🔒',
    color: 'magenta',
    category: 'security',
  },
  {
    slug: 'ai-tools',
    num: '05',
    name: 'XFree AI Tools',
    description: 'Prompt engineering tools, token counters, and AI workflow utilities.',
    icon: '🤖',
    color: 'purple',
    category: 'ai',
  },
  {
    slug: 'text-tools',
    num: '06',
    name: 'XFree Text Tools',
    description: 'Word counters, diff checkers, case converters, and text manipulation utilities.',
    icon: '📝',
    color: 'amber',
    category: 'text',
  },
  {
    slug: 'converters',
    num: '07',
    name: 'XFree File Converters',
    description: 'Base64, URL encoding, HTML entities, and format conversion tools.',
    icon: '🔄',
    color: 'cyan',
    category: 'developer',
  },
  {
    slug: 'generators',
    num: '08',
    name: 'XFree Online Generators',
    description: 'UUID, QR code, password, and cron expression generators.',
    icon: '⚙️',
    color: 'amber',
    category: 'developer',
  },
  {
    slug: 'validators',
    num: '09',
    name: 'XFree Data Validators',
    description: 'JSON Schema, HTML, CSS, and JavaScript syntax validators.',
    icon: '✓',
    color: 'green',
    category: 'developer',
  },
  {
    slug: 'business-tools',
    num: '10',
    name: 'XFree Business Tools',
    description: 'Calculators, date/time utilities, and productivity tools for business users.',
    icon: '💼',
    color: 'cyan',
    category: 'business',
  },
];

export const AUTHORITY_PILLARS: PillarDefinition[] = [
  {
    slug: 'xfree-app',
    num: 'A1',
    name: 'XFree App - Official Free Developer Tools Platform',
    description: 'The XFree App is the ultimate free online platform for developers. Access privacy-first micro-tools including JSON formatters, regex testers, and SEO utilities. 100% client-side, no signup required.',
    icon: '⚡',
    color: 'glow',
    category: 'authority',
  },
  {
    slug: 'how-it-works',
    num: 'A2',
    name: 'How XFree Works - Privacy-First Local Processing',
    description: 'XFree tools process your data inside your browser session using JavaScript and WebAssembly. No data is sent to external servers unless clearly disclosed.',
    icon: '🔒',
    color: 'cyan',
    category: 'authority',
  },
];

export function findPillarBySlug(slug: string): PillarDefinition | undefined {
  return [...PILLARS, ...AUTHORITY_PILLARS].find((p) => p.slug === slug);
}
