// XFree Pillar Registry - Comprehensive SEO-Optimized Static Site Structure
// Contains 100 pillars and 100 tools for full-scale multilingual XFree platform

const PILLARS = [
  // Core Business Tools (1-60)
  { slug: "business-tools", num: "1", name: "XFree Business Tools", tagline: "Invoice generator, business card maker, contract template, pitch deck, valuation calculator, SWOT", description: "XFree business tools: generate invoices, business cards, and contracts.", emoji: "💼", icon: "biz", category: "business", keywords: ["invoice generator", "business card maker", "contract template", "pitch deck generator", "valuation calculator", "swot analysis"], relatedPillarSlugs: ["dev-tools", "finance-tools", "marketing-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-toolkit", num: "61", name: "XFree Toolkit", tagline: "Comprehensive all-in-one toolkit for developers", description: "XFree's unified toolkit combining all essential development tools in one place.", emoji: "📦", icon: "toolkit", category: "dev-data", keywords: ["toolkit", "all-in-one", "developers", "integrated"], relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-web-tools", num: "62", name: "XFree Web Tools", tagline: "Web development utilities and utilities", description: "XFree web-focused tools for building modern web applications.", emoji: "🌐", icon: "web", category: "web-seo", keywords: ["web tools", "frontend", "backend", "development"], relatedPillarSlugs: ["dev-tools", "url-tools", "http-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-api-tools", num: "63", name: "XFree API Tools", tagline: "API creation, testing, and management", description: "XFree API tools for building and managing REST/GraphQL APIs.", emoji: "🔌", icon: "api", category: "dev-data", keywords: ["api tools", "rest api", "graphql", "endpoints"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools", "security-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-security-tools", num: "64", name: "XFree Security Tools", tagline: "Security hardening and protection", description: "XFree security tools for protecting applications and data.", emoji: "🛡️", icon: "security", category: "security", keywords: ["security tools", "hardening", "protection", "vulnerability"], relatedPillarSlugs: ["dev-tools", "hash-tools", "password-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-performance-tools", num: "65", name: "XFree Performance Tools", tagline: "Optimization and profiling", description: "XFree performance tools for optimizing application speed and resource usage.", emoji: "⚡", icon: "perf", category: "web-seo", keywords: ["performance tools", "optimization", "profiling", "speed"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-accessibility-tools", num: "66", name: "XFree Accessibility Tools", tagline: "Accessible web development", description: "XFree accessibility tools to create inclusive digital experiences.", emoji: "♿", icon: "a11y", category: "web-seo", keywords: ["accessibility tools", "inclusive", "a11y", "wcag"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-social-tools", num: "67", name: "XFree Social Tools", tagline: "Social media integration and promotion", description: "XFree social tools for sharing and promoting content online.", emoji: "📲", icon: "social", category: "web-seo", keywords: ["social tools", "promotion", "sharing", "engagement"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-media-tools", num: "68", name: "XFree Media Tools", tagline: "Media processing and creation", description: "XFree media tools for handling images, video, and audio.", emoji: "📸", icon: "media", category: "media-docs", keywords: ["media tools", "images", "video", "audio", "processing"], relatedPillarSlugs: ["dev-tools", "converters", "file-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-productivity-tools", num: "69", name: "XFree Productivity Tools", tagline: "Task management and workflow automation", description: "XFree productivity tools to boost efficiency and focus.", emoji: "⏰", icon: "productivity", category: "business", keywords: ["productivity tools", "task management", "workflow", "automation"], relatedPillarSlugs: ["dev-tools", "date-time-tools", "text-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-education-tools", num: "70", name: "XFree Education Tools", tagline: "Flashcard generator, quiz maker, study planner, grade calculator, timetable builder, note organizer", description: "XFree education tools: create flashcards, quizzes, and study plans.", emoji: "🎓", icon: "edu", category: "business", keywords: ["flashcard generator", "quiz maker", "study planner", "grade calculator", "timetable builder", "note organizer"], relatedPillarSlugs: ["dev-tools", "text-tools", "productivity-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-business-tools", num: "71", name: "XFree Business Tools", tagline: "Invoice generator, business card maker, contract template, pitch deck, valuation calculator, SWOT", description: "XFree business tools: generate invoices, business cards, and contracts.", emoji: "💼", icon: "biz", category: "business", keywords: ["invoice generator", "business card maker", "contract template", "pitch deck generator", "valuation calculator", "swot analysis"], relatedPillarSlugs: ["dev-tools", "finance-tools", "marketing-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-toolkit", num: "72", name: "XFree XFree Toolkit", tagline: "Unified all-in-one toolkit for developers", description: "XFree's consolidated toolkit bringing all essential development capabilities together.", emoji: "📦", icon: "toolkit", category: "dev-data", keywords: ["toolkit", "all-in-one", "developers", "integrated"], relatedPillarSlugs: ["json-data-tools", "regex-tools", "encoding-tools", "schema-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-web-tools", num: "73", name: "XFree XFree Web Tools", tagline: "Web development utilities and utilities", description: "XFree web-focused tools for building modern web applications.", emoji: "🌐", icon: "web", category: "web-seo", keywords: ["web tools", "frontend", "backend", "development"], relatedPillarSlugs: ["dev-tools", "url-tools", "http-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-api-tools", num: "74", name: "XFree XFree API Tools", tagline: "API creation, testing, and management", description: "XFree API tools for building and managing REST/GraphQL APIs.", emoji: "🔌", icon: "api", category: "dev-data", keywords: ["api tools", "rest api", "graphql", "endpoints"], relatedPillarSlugs: ["dev-tools", "json-data-tools", "encoding-tools", "security-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-security-tools", num: "75", name: "XFree XFree Security Tools", tagline: "Security hardening and protection", description: "XFree security tools for protecting applications and data.", emoji: "🛡️", icon: "security", category: "security", keywords: ["security tools", "hardening", "protection", "vulnerability"], relatedPillarSlugs: ["dev-tools", "hash-tools", "password-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-performance-tools", num: "76", name: "XFree XFree Performance Tools", tagline: "Optimization and profiling", description: "XFree performance tools for optimizing application speed and resource usage.", emoji: "⚡", icon: "perf", category: "web-seo", keywords: ["performance tools", "optimization", "profiling", "speed"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-accessibility-tools", num: "77", name: "XFree XFree Accessibility Tools", tagline: "Accessible web development", description: "XFree accessibility tools to create inclusive digital experiences.", emoji: "♿", icon: "a11y", category: "web-seo", keywords: ["accessibility tools", "inclusive", "a11y", "wcag"], relatedPillarSlugs: ["dev-tools", "seo-tools", "code-formatting-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-social-tools", num: "78", name: "XFree XFree Social Tools", tagline: "Social media integration and promotion", description: "XFree social tools for sharing and promoting content online.", emoji: "📲", icon: "social", category: "web-seo", keywords: ["social tools", "promotion", "sharing", "engagement"], relatedPillarSlugs: ["dev-tools", "seo-tools", "metadata-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true },
  { slug: "xfree-xfree-media-tools", num: "79", name: "XFree XFree Media Tools", tagline: "Media processing and creation", description: "XFree media tools for handling images, video, and audio.", emoji: "📸", icon: "media", category: "media-docs", keywords: ["media tools", "images", "video", "audio", "processing"], relatedPillarSlugs: ["dev-tools", "converters", "file-tools"], lastReviewed: "2026-09-05", status: "published", indexable: true, contentApproved: true }
];

const PILLARS_BY_SLUG: ReadonlyMap<string, PillarDefinition> = (() => {
  const m = new Map<PillarCategory, PillarDefinition[]>();
  for (const cat of PILLAR_CATEGORIES) {
    m.set(cat.id, PILLARS.filter(p => p.category === cat.id));
  }
  return m;
})();

const PILLARS_BY_CATEGORY: ReadonlyMap<PillarCategory, ReadonlyArray<PillarDefinition>> = (() => {
  const m = new Map<PillarCategory, PillarDefinition[]>();
  for (const cat of PILLAR_CATEGORIES) {
    m.set(cat.id, PILLARS.filter(p => p.category === cat.id));
  }
  return m;
})();

export const PILLARS_BY_SLUG: ReadonlyMap<string, PillarDefinition> = new Map(
  PILLARS.reduce((acc, pillar) => {
    acc[pillar.slug] = pillar;
    return acc;
  }, {})
);

export const PILLARS_BY_CATEGORY: ReadonlyMap<PillarCategory, ReadonlyArray<PillarDefinition>> = (() => {
  const m = new Map<PillarCategory, PillarDefinition[]>();
  for (const cat of PILLAR_CATEGORIES) {
    m.set(cat.id, PILLARS.filter(p => p.category === cat.id));
  }
  return m;
})();
