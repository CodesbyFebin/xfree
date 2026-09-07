export type Locale = 'en' | 'es' | 'fr' | 'pt' | 'de' | 'ja';

export interface LocaleDict {
  nav: {
    home: string;
    tools: string;
    pillars: string;
    guides: string;
    faq: string;
    about: string;
    contact: string;
    roadmap: string;
    useCases: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    stats: {
      tools: string;
      pillars: string;
      languages: string;
      privacy: string;
    };
  };
  pillars: {
    title: string;
    subtitle: string;
    viewAll: string;
    toolCount: string;
  };
  tools: {
    title: string;
    subtitle: string;
    search: string;
    category: string;
    pillar: string;
    useFree: string;
  };
  footer: {
    tagline: string;
    privacy: string;
    terms: string;
    contact: string;
    copyright: string;
  };
  common: {
    loading: string;
    error: string;
    backToTop: string;
    copy: string;
    copied: string;
    close: string;
    menu: string;
    search: string;
    language: string;
  };
  seo: {
    pillarsTitle: string;
    pillarsDescription: string;
    toolHubTitle: string;
    toolHubDescription: string;
  };
}