export interface PillarDefinition {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export const PILLARS_50: PillarDefinition[] = [
  { id: 1, name: "Frontend Development", slug: "frontend-development", icon: "🌐", description: "Modern UI engineering, DOM manipulation, client-side rendering, and responsive web toolsets." },
  { id: 2, name: "Backend Development", slug: "backend-development", icon: "⚡", description: "Server architectures, runtime environments, middleware processing, and API endpoints." },
  { id: 3, name: "DevOps & CI/CD", slug: "devops-cicd", icon: "🚀", description: "Continuous integration, automated pipelines, deployment workflows, and container runtimes." },
  { id: 4, name: "Cybersecurity & Privacy", slug: "cybersecurity-privacy", icon: "🔒", description: "Cryptographic operations, privacy enforcement, credential generation, and threat auditing." },
  { id: 5, name: "Technical SEO", slug: "technical-seo", icon: "📈", description: "Search engine crawlability, schema validation, URL hygiene, and indexing diagnostics." },
  { id: 6, name: "Content & Copywriting", slug: "content-copywriting", icon: "✍️", description: "Text analysis, readability scoring, word analytics, and editorial utilities." },
  { id: 7, name: "Data Engineering", slug: "data-engineering", icon: "📊", description: "ETL pipelines, schema transformations, stream ingestion, and columnar formats." },
  { id: 8, name: "AI & Machine Learning", slug: "ai-machine-learning", icon: "🤖", description: "Token counting, prompt engineering, embedding math, and model orchestration." },
  { id: 9, name: "Database Management", slug: "database-management", icon: "🗄️", description: "Query optimization, schema migration, relational mapping, and indexing strategies." },
  { id: 10, name: "API Development & Testing", slug: "api-development-testing", icon: "🔌", description: "REST, GraphQL, gRPC payload inspection, mock endpoints, and latency testing." },
  { id: 11, name: "Cloud Infrastructure", slug: "cloud-infrastructure", icon: "☁️", description: "Serverless configurations, cloud cost estimation, IAM rules, and edge routing." },
  { id: 12, name: "Mobile Development", slug: "mobile-development", icon: "📱", description: "iOS, Android, React Native, and Flutter asset preparation and deep-link generation." },
  { id: 13, name: "UI/UX Design", slug: "ui-ux-design", icon: "🎨", description: "Design tokens, layout visualizers, spacing math, and component geometry." },
  { id: 14, name: "Web Accessibility (a11y)", slug: "web-accessibility", icon: "♿", description: "WCAG 2.2 auditing, contrast checking, screen reader semantics, and focus management." },
  { id: 15, name: "Performance Optimization", slug: "performance-optimization", icon: "⚡", description: "Core Web Vitals tuning, bundle size analysis, and asset minification." },
  { id: 16, name: "Blockchain & Web3", slug: "blockchain-web3", icon: "⛓️", description: "Smart contract inspection, wallet signature generation, and EVM gas estimators." },
  { id: 17, name: "Game Development", slug: "game-development", icon: "🎮", description: "Sprite sheet packing, math coordinate converters, and frame delta timers." },
  { id: 18, name: "Network Engineering", slug: "network-engineering", icon: "🌐", description: "CIDR subnet calculation, DNS record formatting, and packet payload analyzers." },
  { id: 19, name: "System Administration", slug: "system-administration", icon: "🖥️", description: "Cron expression generators, bash script linters, and Linux permission calculators." },
  { id: 20, name: "Version Control (Git)", slug: "version-control-git", icon: "🔀", description: "Commit convention helpers, gitignore generators, and branch strategy calculators." },
  { id: 21, name: "Code Quality & Refactoring", slug: "code-quality-refactoring", icon: "✨", description: "Complexity scoring, dead code detection, and syntax modernization." },
  { id: 22, name: "Documentation & Tech Writing", slug: "documentation-tech-writing", icon: "📄", description: "API docs generation, markdown formatting, and changelog builders." },
  { id: 23, name: "Project Management", slug: "project-management", icon: "📋", description: "Sprint capacity calculators, burn-down math, and task prioritization matrixes." },
  { id: 24, name: "Agile Workflows", slug: "agile-workflows", icon: "🔄", description: "Story point poker tools, velocity estimators, and retro template generators." },
  { id: 25, name: "E-commerce Development", slug: "ecommerce-development", icon: "🛒", description: "Product feed validators, SKU formatters, and discount rate calculators." },
  { id: 26, name: "Headless CMS", slug: "headless-cms", icon: "🧩", description: "Content model visualizers, GraphQL query generators, and webhook testing." },
  { id: 27, name: "Email Development", slug: "email-development", icon: "📧", description: "HTML email inliners, MJML compilers, and inbox preview test harnesses." },
  { id: 28, name: "Video Processing", slug: "video-processing", icon: "🎥", description: "FFmpeg command builders, aspect ratio math, and bitrate calculators." },
  { id: 29, name: "Image Processing", slug: "image-processing", icon: "🖼️", description: "Client-side WebP/AVIF compression, metadata stripping, and SVG cleaners." },
  { id: 30, name: "Typography & Web Fonts", slug: "typography-web-fonts", icon: "🔤", description: "Type scale calculators, variable font playground, and font format converters." },
  { id: 31, name: "Color Theory & Palettes", slug: "color-theory-palettes", icon: "🎨", description: "HEX/RGB/HSL converters, palette harmonic generators, and color delta E." },
  { id: 32, name: "Regular Expressions (Regex)", slug: "regular-expressions-regex", icon: "🔍", description: "Regex testing, pattern visualizers, and escape string generators." },
  { id: 33, name: "Cryptography & Hashing", slug: "cryptography-hashing", icon: "🔑", description: "SHA-256/512 generators, HMAC calculators, and AES client encryptors." },
  { id: 34, name: "Unit & Integration Testing", slug: "unit-integration-testing", icon: "🧪", description: "Mock data generators, fixture builders, and assertion syntax helpers." },
  { id: 35, name: "Browser Extensions", slug: "browser-extensions", icon: "🧩", description: "Manifest V3 builders, icon pack generators, and permission checkers." },
  { id: 36, name: "WebAssembly (Wasm)", slug: "webassembly-wasm", icon: "⚙️", description: "Wasm binary inspectors, WAT text disassemblers, and runtime benchmarks." },
  { id: 37, name: "Serverless Computing", slug: "serverless-computing", icon: "⚡", description: "Cold-start calculators, Lambda payload testers, and edge function helpers." },
  { id: 38, name: "Containerization (Docker/K8s)", slug: "containerization-docker-k8s", icon: "🐳", description: "Dockerfile optimizers, Kubernetes YAML generators, and compose validators." },
  { id: 39, name: "Monitoring & Observability", slug: "monitoring-observability", icon: "📡", description: "PromQL query builders, SLO/SLA error budget math, and log parsers." },
  { id: 40, name: "Logging & Analytics", slug: "logging-analytics", icon: "📝", description: "Logstash pattern generators, JSON log formatters, and metric aggregators." },
  { id: 41, name: "Localization (i18n)", slug: "localization-i18n", icon: "🌍", description: "Gettext PO/MO converters, ICU message formatters, and hreflang tag builders." },
  { id: 42, name: "File Format Conversion", slug: "file-format-conversion", icon: "🔄", description: "Client-side file conversions for JSON, CSV, XML, YAML, and PDF." },
  { id: 43, name: "Markdown & Text Processing", slug: "markdown-text-processing", icon: "📝", description: "Markdown to HTML compilers, diff checkers, and text case converters." },
  { id: 44, name: "JSON, XML & YAML Utils", slug: "json-xml-yaml-utils", icon: "📄", description: "Bi-directional serialization, schema validation, and path extractors." },
  { id: 45, name: "CSS Utilities", slug: "css-utilities", icon: "📐", description: "Flexbox/Grid visualizers, box-shadow generators, and CSS minifiers." },
  { id: 46, name: "JavaScript & TypeScript Utils", slug: "javascript-typescript-utils", icon: "⚡", description: "TypeScript interface generators, AST viewers, and JS minifiers." },
  { id: 47, name: "Python Developer Utils", slug: "python-developer-utils", icon: "🐍", description: "Pip requirements formatters, pyproject.toml builders, and docstring helpers." },
  { id: 48, name: "Rust & Systems Programming", slug: "rust-systems-programming", icon: "🦀", description: "Cargo.toml builders, unsafe audit checklists, and memory size calculators." },
  { id: 49, name: "Open Source Compliance", slug: "open-source-compliance", icon: "⚖️", description: "SPDX license pickers, notice generators, and dependency audits." },
  { id: 50, name: "Developer Productivity", slug: "developer-productivity", icon: "⏱️", description: "Pomodoro timers, snippet managers, and quick scratchpads." }
];

export const CLUSTERS_50: string[] = [
  "Utilities", "Generators", "Converters", "Validators", "Analyzers",
  "Formatters", "Debuggers", "Optimizers", "Testers", "Builders",
  "Calculators", "Encoders/Decoders", "Visualizers", "Linters", "Simulators",
  "Playgrounds", "Extractors", "Mappers", "Transformers", "Compilers",
  "Snippets", "Templates", "Checkers", "Monitors", "Scanners",
  "Profilers", "Benchmarkers", "Migrators", "Synchronizers", "Packagers",
  "Bundlers", "Transpilers", "Polyfills", "Shims", "Mockers",
  "Stubs", "Fakers", "Data Generators", "Parsers", "Serializers",
  "Deserializers", "Query Builders", "Schema Designers", "Indexers", "Cachers",
  "Traffic Shapers", "Rate Limiters", "Webhook Testers", "CLI Builders", "SDK Generators"
];

export const MODIFIERS_10: string[] = [
  "Client-Side Minifier",
  "Instant Converter",
  "Privacy-First Validator",
  "Local Analyzer",
  "Browser-Based Formatter",
  "Offline Debugger",
  "WASM Optimizer",
  "Zero-Telemetry Tester",
  "Open-Source Builder",
  "Quick Calculator"
];

/**
 * The 25,000 figure is a taxonomy/roadmap scope: 50 pillars × 50 clusters ×
 * 10 modifier patterns. It is not a count of published tools.
 */
export const ROADMAP_CONCEPT_COUNT = PILLARS_50.length * CLUSTERS_50.length * MODIFIERS_10.length;

/** Map currently published handwritten tools to the roadmap pillar they substantively support. */
export const TOOL_PILLAR_MAP: Record<string, string> = {
  "bulk-url-extractor": "technical-seo",
  "xml-sitemap-generator": "technical-seo",
  "json-formatter": "json-xml-yaml-utils",
  "regex-tester": "regular-expressions-regex",
  "cron-expression-generator": "system-administration",
  "meta-tag-generator": "technical-seo",
  "robots-txt-generator": "technical-seo",
  "schema-markup-generator": "technical-seo",
  "base64-encoder-decoder": "cryptography-hashing",
  "url-slug-utm-builder": "technical-seo",
};

export function getPillarBySlug(slug: string): PillarDefinition | undefined {
  return PILLARS_50.find((pillar) => pillar.slug === slug);
}

export function getGitHubIssueUrl(toolName: string, pillarName: string, description: string): string {
  const repo = "https://github.com/CodesbyFebin/xfree";
  const title = encodeURIComponent(`Build: ${toolName}`);
  const body = encodeURIComponent(
`### Tool specification
**Tool:** ${toolName}
**Pillar:** ${pillarName}
**Purpose:** ${description}

### Publication requirements
- Implement a real working tool before adding a public route.
- Prefer local/browser processing when technically appropriate; disclose any cloud processing.
- Add tests, error handling, accessibility, and meaningful documentation.
- Keep draft/planned concepts out of the public sitemap until approved.
- Add unique title, description, H1, examples, limitations, and internal links before requesting indexability.
`
  );
  return `${repo}/issues/new?title=${title}&body=${body}&labels=good%20first%20issue,help%20wanted`;
}
