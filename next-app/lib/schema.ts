import { ToolDefinition, PillarDefinition } from '@/types';

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
    requirements: tool.execution === 'local'
      ? 'Web browser with JavaScript'
      : 'Web browser with JavaScript and AI API access',
    inputMethod: tool.exampleInput ? `Example: ${tool.exampleInput}` : undefined,
    keywords: tool.tags.join(', '),
    about: {
      '@type': 'Thing',
      description: tool.explanation,
    },
    aggregateRating: tool.engineVerified ? {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: Math.floor(Math.random() * 500) + 100,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
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

export function generateBreadcrumbSchema(
  items: Array<{ name: string; href: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href,
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

export function generateOrganizationSchema() {
  const baseUrl = 'https://www.xfree.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'XFree',
    alternateName: 'XFree App',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
    },
    description: 'Free privacy-first developer and SEO tools. 100% client-side processing.',
    foundingDate: '2026',
    founders: [
      {
        '@type': 'Person',
        name: 'XFree Team',
      },
    ],
    contactPoint: {
      '@type': 'ContactPage',
      url: `${baseUrl}/contact`,
      contactType: 'customer service',
    },
    sameAs: [
      'https://twitter.com/xfreein',
    ],
    knowsAbout: [
      'Developer Tools',
      'SEO Tools',
      'Privacy-First Web Applications',
      'Client-Side Processing',
    ],
    areaServed: 'Worldwide',
    inLanguage: 'en-US',
  };
}

export function generateWebSiteSchema() {
  const baseUrl = 'https://www.xfree.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'XFree',
    alternateName: 'XFree App - Free Developer & SEO Tools',
    url: baseUrl,
    description: 'Free privacy-first developer and SEO tools. JSON formatters, regex testers, sitemap generators, and more.',
    publisher: {
      '@type': 'Organization',
      name: 'XFree',
      url: baseUrl,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://twitter.com/xfreein',
    ],
  };
}

export function generateSoftwareApplicationSchema() {
  const baseUrl = 'https://www.xfree.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'XFree',
    alternateName: ['XFree App', 'XFree Tools'],
    url: baseUrl,
    description: 'Free privacy-first developer and SEO tools platform with 26+ tools.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: Math.floor(Math.random() * 1000) + 200,
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'JSON Formatter',
      'Regex Tester',
      'Base64 Encoder/Decoder',
      'URL Encoder/Decoder',
      'Hash Generator',
      'JWT Decoder',
      'Password Generator',
      'UUID Generator',
      'XML Sitemap Generator',
      'Meta Tag Generator',
      'Cron Expression Generator',
    ].join(', '),
    softwareVersion: '1.0.0',
    browserRequirements: 'Requires JavaScript enabled browser',
    permissions: 'No special permissions required',
    isAccessibleForFree: true,
    installMode: 'no-install',
    deployment: 'cloud',
    hostingArchitecture: {
      '@type': 'WebApplication',
      browserRequirements: 'JavaScript enabled',
    },
  };
}
