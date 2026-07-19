import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('demo fixture shows explicit status and supports palace/decade navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.locator('.intake__privacy summary').click();
  await page.getByLabel(/i have read/i).check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /calculate atlas/i }).click();
  await expect(page.getByRole('status', { name: /report status/i })).toContainText('DEMO_FIXTURE');
  await expect(page.getByRole('status', { name: /report status/i })).toContainText('SOURCE_NEEDED');
  // Guided summary is the default report sub-view (Western-adaptation Iteration 1): the
  // "prominent ≠ good/bad" line is present before the traditional atlas, on both projects.
  await expect(page.getByTestId('guided-not-verdict')).toBeVisible();
  // The 4x4 palace grid is desktop-only (< 768px swaps to MobilePalaceNavigator, covered by
  // the T08 mobile-a11y specs), so grid-cell navigation is asserted on desktop only. Status
  // assertions above run on both projects.
  if (test.info().project.name !== 'mobile-chromium') {
    // Switch from the guided view to the traditional atlas for grid-cell navigation.
    await page.getByTestId('guided-to-traditional').click();
    await page.getByTestId('palace-cell-GUAN_LU').click();
    await expect(page.getByRole('complementary')).toContainText('natal:TAI_YANG');
    await page.getByRole('tab', { name: /46/ }).click();
    await expect(page.getByTestId('palace-cell-GUAN_LU')).toHaveAttribute('aria-pressed', 'true');
  }
});

test('@a11y landing has no serious axe violations and keyboard reaches intake', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['critical','serious'].includes(violation.impact ?? ''))).toEqual([]);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeVisible();
});

test('reduced motion disables relation drawing animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('.mineral-circle').first().evaluate((element) => getComputedStyle(element).animationDuration);
  expect(['0s','0.001ms','0.01ms']).toContain(duration);
});

test('browser never requests a FuFirE or LLM upstream URL', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/\/v1\/calculate\/zwds|\/v1\/metadata\/zwds|openai|anthropic/i.test(url)) external.push(url);
  });
  await page.goto('/');
  expect(external).toEqual([]);
});