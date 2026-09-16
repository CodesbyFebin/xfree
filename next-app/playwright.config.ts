import { defineConfig, devices } from '@playwright/test';

// Runs against a production build (`next build && next start`), not `next
// dev` - dev mode's React devtools eval() usage and unminified bundles
// aren't representative of what's actually deployed, and this is also what
// lets the CSP's real script-src get exercised honestly (see
// docs/SECURITY_MODEL.md on why 'unsafe-eval' was removed only after
// confirming dev-only React behavior wasn't masking a real requirement).
const PORT = process.env.PLAYWRGHT_PORT ? Number(process.env.PLAYWRGHT_PORT) : 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      // 390px matches the iPhone 12/13/14 class - one of the three widths
      // (360/390/430) the Studio hardening section asks for; the other two
      // are exercised directly in tests/e2e/mobile.spec.ts via
      // page.setViewportSize rather than a full separate project, since
      // they only need to check layout/nav, not the whole suite twice more.
      // devices['iPhone 13'] defaults to the webkit engine - only chromium
      // is installed in this environment/CI (see the build steps that run
      // `npx playwright install --with-deps chromium`), so pin the engine
      // explicitly rather than pull in a second browser download just for
      // viewport/touch emulation this project doesn't otherwise need.
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
