import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('demo fixture shows explicit status and supports palace/decade navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByText(/privacy notice/i).click();
  await page.getByLabel(/i have read/i).check();
  await page.getByRole('button', { name: /next/i }).click();
  await page.getByRole('button', { name: /calculate atlas/i }).click();
  await expect(page.getByRole('status')).toContainText('DEMO_FIXTURE');
  await expect(page.getByRole('status')).toContainText('SOURCE_NEEDED');
  await page.getByTestId('palace-cell-GUAN_LU').click();
  await expect(page.getByRole('complementary')).toContainText('natal:TAI_YANG');
  await page.getByRole('tab', { name: /46/ }).click();
  await expect(page.getByTestId('palace-cell-GUAN_LU')).toHaveAttribute('aria-pressed', 'true');
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