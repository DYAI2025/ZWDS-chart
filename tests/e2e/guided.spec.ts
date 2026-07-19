import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Reality-grounds the Western-adaptation Guided views (docs/plans/2026-07-19…) in a real
// browser: the guided summary is the default report sub-view, states the critical
// non-verdict, caps prominent palaces at three, and hands off to the traditional atlas.
async function reachGuided(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByLabel(/i have read/i).check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /calculate atlas/i }).click();
  await expect(page.getByText('Your chart at a glance')).toBeVisible();
}

test('guided summary opens by default, caps prominent palaces at three, and hands off to the atlas', async ({ page }, testInfo) => {
  await reachGuided(page);
  await expect(page.getByTestId('guided-not-verdict')).toContainText(/does not automatically mean good or bad/i);

  const cards = page.getByTestId('guided-prominent-cards').locator('article');
  expect(await cards.count()).toBeLessThanOrEqual(3);
  expect(await cards.count()).toBeGreaterThan(0);

  await page.getByTestId('guided-to-traditional').click();
  if (testInfo.project.name !== 'mobile-chromium') {
    await expect(page.getByTestId('palace-grid')).toBeVisible();
  }
});

test('@a11y guided report view has no serious or critical axe violations', async ({ page }) => {
  await reachGuided(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))).toEqual([]);
});
