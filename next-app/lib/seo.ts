import { Metadata } from 'next';
import { ToolDefinition, PillarDefinition } from '@/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xfree.in';
const SITE_NAME = 'XFree App';
const DEFAULT_OG_IMAGE = '/og-image.png';

interface SeoOptions {
  title: string;
  description: string;
  keywords?: string[];
  slug: string;
  type?: 'website' | 'article' | 'tool';
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function generateToolMetadata(tool: ToolDefinition): Metadata {
  const title = `${tool.title} | Free Online ${tool.categoryLabel}`;
  const description = `${tool.shortDescription} Use this free XFree tool for ${tool.tags.join(', ')}. 100% client-side, no signup required.`;
  const url = `${SITE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    keywords: tool.tags.map((tag) => `${tag} tool, free ${tag}, XFree ${tag}`),
    authors: [{ name: 'XFree Contributors' }],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'article',
      images: [
        {
          url: tool.exampleInput ? DEFAULT_OG_IMAGE : DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${tool.title} - XFree App`,
        },
      ],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
      creator: '@xfree_app',
    },
    alternates: {
      canonical: url,
      languages: {
        'en-US': url,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generatePillarMetadata(pillar: PillarDefinition): Metadata {
  const title = `${pillar.name} | ${SITE_NAME}`;
  const description = pillar.description;
  const url = `${SITE_URL}/pillars/${pillar.slug}`;

  return {
    title,
    description,
    keywords: [pillar.name, 'free tools', 'online tools', 'XFree', pillar.category],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${pillar.name} - XFree App`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateCategoryMetadata(category: { label: string; slug: string; description?: string }): Metadata {
  const title = `${category.label} | Free Online ${category.label} - ${SITE_NAME}`;
  const description = category.description || `Free ${category.label.toLowerCase()} - 100% client-side, no signup required.`;
  const url = `${SITE_URL}/categories/${category.slug}`;

  return {
    title,
    description,
    keywords: [category.label, 'free tools', 'XFree', 'online tools'],
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: category.label }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateHomeMetadata(): Metadata {
  const title = `${SITE_NAME} - Free Online Developer & SEO Tools`;
  const description = 'Free browser-based tools for developers and SEO professionals. JSON formatter, regex tester, hash generator, and 50+ more. 100% client-side, privacy-first.';

  return {
    title,
    description,
    keywords: ['free tools', 'developer tools', 'SEO tools', 'JSON formatter', 'regex tester', 'online tools'],
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: SITE_NAME,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}

export function generateAeoMetadata(options: SeoOptions) {
  return {
    'article:title': options.title,
    'article:description': options.description,
    'article:type': options.type || 'article',
    'article:published_time': options.publishedTime,
    'article:modified_time': options.modifiedTime,
    'article:author': options.authors?.map((a) => ({ name: a })),
    'article:tag': options.tags,
  };
}

export function generateGeoMetadata(options: { city?: string; country?: string }) {
  return {
    'geo.region': options.country ? `${options.city || ''}, ${options.country}` : undefined,
    'geo.placename': options.city,
    'geo.position': undefined,
    ICBM: undefined,
  };
}

export function generateJsonLd(args: {
  type: 'Organization' | 'WebSite' | 'SoftwareApplication' | 'FAQPage' | 'BreadcrumbList';
  data: Record<string, unknown>;
}) {
  const schemas: Record<string, Record<string, unknown>> = {
    Organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      sameAs: [
        'https://twitter.com/xfree_app',
        'https://github.com/xfree-app',
      ],
    },
    WebSite: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  };

  return {
    '@context': 'https://schema.org',
    '@type': args.type,
    ...(args.data as Record<string, unknown>),
  };
}
