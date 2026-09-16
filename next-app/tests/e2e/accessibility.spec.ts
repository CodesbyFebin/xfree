import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.0/2.1 A+AA, matching the tag set the (root-app-only, see
// docs/PRODUCTION_ARCHITECTURE.md) accessibility.yml workflow already uses
// for the legacy app - kept consistent rather than inventing a different bar.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const PAGES: { name: string; path: string }[] = [
  { name: 'homepage', path: '/' },
  { name: 'a local tool page', path: '/tools/json-formatter' },
  { name: 'a server-dependent tool page', path: '/tools/dns-lookup' },
  { name: 'a pillar page', path: '/pillars/json-data-tools' },
  { name: 'the FAQ page', path: '/faq' },
  { name: 'the Signals page', path: '/updates' },
];

for (const { name, path } of PAGES) {
  test(`${name} (${path}) has no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.help}`).join('\n');
    expect(results.violations, `Accessibility violations on ${path}:\n${summary}`).toHaveLength(0);
  });
}

test('mobile menu toggle is reachable and correctly labeled for assistive tech', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/faq');
  // Matched by role+name only up front - the accessible name itself
  // changes (Open -> Close) once toggled, so re-locate by the stable
  // #mobile-nav-menu id/button role afterward rather than the original name.
  const openToggle = page.getByRole('button', { name: 'Open menu' });
  await expect(openToggle).toBeVisible();
  await expect(openToggle).toHaveAttribute('aria-expanded', 'false');
  await openToggle.click();

  const closeToggle = page.getByRole('button', { name: 'Close menu' });
  await expect(closeToggle).toBeVisible();
  await expect(closeToggle).toHaveAttribute('aria-expanded', 'true');
});
