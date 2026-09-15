import { test, expect } from '@playwright/test';

test.describe('Keyboard accessibility', () => {
  test('skip link is the first focus stop and jumps to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('every focused interactive element has a visible focus indicator', async ({ page }) => {
    await page.goto('/tools/json-formatter');
    const outlines: string[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const style = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return { outline: cs.outlineStyle, outlineWidth: cs.outlineWidth, boxShadow: cs.boxShadow, tag: el.tagName };
      });
      if (style) outlines.push(JSON.stringify(style));
    }
    const hasNoVisibleFocusStyle = (s: string) => {
      const parsed = JSON.parse(s);
      const noOutline = parsed.outline === 'none' || parsed.outlineWidth === '0px';
      const noBoxShadow = !parsed.boxShadow || parsed.boxShadow === 'none';
      return noOutline && noBoxShadow;
    };
    const offenders = outlines.filter(hasNoVisibleFocusStyle);
    expect(offenders, `Elements with no visible focus indicator: ${offenders.join(', ')}`).toHaveLength(0);
  });

  test('mobile menu can be operated entirely from the keyboard, including Escape to close', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/faq');

    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mobile-nav-menu')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav-menu')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });
});
