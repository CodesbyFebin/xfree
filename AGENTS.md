# AGENTS.md

project:
  name: XFree
  repository: https://github.com/CodesbyFebin/xfree
  site: https://www.xfree.in
  domain: browser-tools
  status: production-site

summary:
  statement: Browser-based developer, SEO, and AI micro-tools with a React/TypeScript client, Express server, server-side AI gateways, prerendered SEO, and explicit live/draft capability controls.
  source_of_truth: README.md

live_stack:
  client:
    - React 19
    - TypeScript
    - Vite 6
    - Tailwind 4
  server:
    - Express 4
    - Zod
  deployment:
    - Vercel serverless
    - prerendered static HTML

implemented:
  - interactive browser tools
  - published guides
  - PWA install surface
  - server-side Google Gemini proxy
  - NVIDIA NIM cloud-mode gateway with task routing and fallback
  - contact, feedback, and lead endpoints with validation and rate limiting
  - prerendered metadata and structured data
  - sitemap, robots.txt, llms.txt generation, and IndexNow
  - security headers and server-side API-key handling

explicit_limits:
  - do not claim 400+ working tools
  - seed-registry draft entries are not live tools
  - known tool gaps remain tracked rather than presented as implemented
  - next-app is an undeployed Next.js rewrite and is not the production application
  - AI/cloud features depend on configured external providers
  - rate limiting is in-memory and the README recommends a durable store before real traffic

verification:
  overview: README.md
  production_readiness: docs/production-readiness.md
  deployment: docs/deploy-vercel.md
  indexing: docs/indexing.md
  content_rules: docs/content.md
  security_headers: src/middleware/security-headers.ts
  tool_registry: src/data/toolsRegistry.ts
  audit: npm run audit:tools
  verify: npm run verify

rules_for_agents:
  - Describe the production stack as React, TypeScript, Vite, and Express; not Next.js.
  - Treat next-app as an undeployed rewrite.
  - Distinguish live/indexable tools from draft registry entries.
  - Do not infer traffic, revenue, users, customers, or AI-provider availability.
  - Preserve explicit unavailable/not-configured behavior for optional AI services.
