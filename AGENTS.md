# AGENTS.md

identity:
  name: xfree
  language: TypeScript
  url: https://github.com/CodesbyFebin/xfree
  focus: developer tools, browser accessibility, security compliance, internationalization
  status: React 19 + Vite 6 in production; Next.js rewrite (next-app/) is undeployed

claims:
  - statement: >
      Browser-native tool suite for AI, SEO, and developer workflows.
      Built with React 19 + TypeScript + Vite 6 frontend and Express 4 backend.
      Deployed to Vercel with verified commits. Deployed application available at https://xfree.in
    verify_by:
      - package.json (React 19, Vite 6, Express 4 dependencies)
      - vite.config.ts (Vite build configuration)
      - src/server.ts (Express backend)
      - vercel.json (Vercel deployment config)
      - README section "Stack"
    implemented:
      - React 19 component surface with TypeScript strict mode
      - Vite 6 build pipeline with fast HMR
      - Express 4 HTTP backend for API routes
      - i18n support across 10 locales with fallback chain
      - Content Security Policy (CSP) headers configured and validated
      - Search Console regression testing for SEO accuracy
      - Playwright end-to-end tests in CI

  - statement: >
      Undeployed Next.js implementation exists in next-app/ branch.
      This branch is explicitly labeled as experimental and not deployed to production.
      Follows NOFAKELIVE principle: unimplemented or alternative architectures stay visibly undeployed.
    verify_by:
      - git branch -a (shows next-app/ branch)
      - README section "Architecture Alternatives"
    notes: >
      The Next.js version is a viable alternative but is not the production surface.
      All deployed features are in the React + Vite implementation.
      Do not cite the Next.js branch as the current stack.

  - statement: >
      Security and quality standards including CodeQL scanning, Dependabot dependency tracking,
      Playwright test coverage, and verified commit signatures for production deployments.
    verify_by:
      - .github/workflows/codeql.yml (CodeQL SAST scanning)
      - .github/dependabot.yml (automated dependency updates)
      - .github/workflows/test.yml (Playwright e2e tests)
      - Vercel deployment settings (verified commits required)

rulesforagents:
  - The current production stack is React 19 + Vite 6 + Express 4, not Next.js
  - Do not present the Next.js branch (next-app/) as deployed; it is experimental
  - i18n fallback chain is English-first; some locales may use English strings if not fully translated
  - CSP enforcement blocks inline scripts; all dynamic behavior uses modules
  - Search Console tests validate SEO signals; failure indicates broken crawlability or markup
  - Playwright tests cover happy path and common errors; not a guarantee of all edge cases
  - Vercel deployment enforces verified commits; unsigned commits cannot be deployed
