import { ToolDefinition, PillarDefinition } from '@/types';
import { buildCanonical } from '@/lib/canonical';

export function generateToolSchema(tool: ToolDefinition) {
  const baseUrl = 'https://www.xfree.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `XFree ${tool.title}`,
    description: tool.shortDescription,
    url: `${baseUrl}/tools/${tool.slug}`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: tool.howToUse.join(', '),
    requirements: tool.execution === 'ai'
      ? 'Web browser with JavaScript and AI API access'
      : tool.execution === 'workflow'
      ? 'Web browser with JavaScript (queries an external service via XFree\'s server)'
      : 'Web browser with JavaScript',
    inputMethod: tool.exampleInput ? `Example: ${tool.exampleInput}` : undefined,
    keywords: tool.tags.join(', '),
    about: {
      '@type': 'Thing',
      description: tool.explanation,
    },
    publisher: {
      '@type': 'Organization',
      name: 'XFree',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`,
      },
    },
    inLanguage: 'en-US',
    license: `${baseUrl}/terms`,
    isAccessibleForFree: true,
    screenshot: `${baseUrl}/og-image.png`,
    discussionUrl: `${baseUrl}/faq`,
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// `item` must be an absolute URL - Search Console flags relative paths
// ("Invalid URL in field id (in itemListElement.item)"). hrefs here are
// locale-less app paths (/tools, /categories/x), so resolve them the same
// way canonicals are resolved: absolute, with the right locale prefix.
export function generateBreadcrumbSchema(
  items: Array<{ name: string; href: string }>,
  locale?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: /^https?:\/\//.test(item.href) ? item.href : buildCanonical(item.href, locale),
    })),
  };
}

export function generateHowToSchema(toolName: string, steps: string[]) {
  const baseUrl = 'https://www.xfree.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use XFree ${toolName}`,
    description: `Step-by-step guide for using the free XFree ${toolName} tool online.`,
    step: steps.map((stepText, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: stepText,
      itemListElement: [{
        '@type': 'HowToDirection',
        text: stepText,
      }],
    })),
    totalTime: 'PT5M',
    supply: {
      '@type': 'HowToSupply',
      name: 'Web browser with internet access',
    },
    tool: {
      '@type': 'HowToTool',
      name: `XFree ${toolName}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'XFree',
      url: baseUrl,
    },
  };
}

export function generatePillarSchema(pillar: PillarDefinition, toolCount: number) {
  const baseUrl = 'https://www.xfree.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `XFree ${pillar.name}`,
    description: pillar.description,
    url: `${baseUrl}/pillars/${pillar.slug}`,
    about: {
      '@type': 'Thing',
      name: `XFree ${pillar.name}`,
      description: pillar.description,
    },
    numberOfItems: toolCount,
    publisher: {
      '@type': 'Organization',
      name: 'XFree',
      url: baseUrl,
    },
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: 'XFree',
      url: baseUrl,
    },
  };
}
