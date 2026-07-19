import { expect, type Page } from '@playwright/test';

/**
 * Walks the demo intake path to the report/atlas view. Same fixture path used by
 * core-flow.spec.ts and a11y-touch-targets.spec.ts (the consent checkbox is toggled
 * directly to avoid the ambiguous privacy-notice text selector). Works in both the
 * desktop-chromium and mobile-chromium projects — the intake flow is identical; only
 * the report layout differs by breakpoint.
 */
export async function reachReportView(page: Page): Promise<void> {
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await page.getByRole('button', { name: /next/i }).click(); // step 0 -> 1
  await page.getByRole('button', { name: /next/i }).click(); // step 1 -> 2
  await page.getByRole('button', { name: /next/i }).click(); // step 2 -> 3
  await page.getByLabel(/i have read/i).check();             // privacy consent
  await page.getByRole('button', { name: /next/i }).click(); // step 3 -> 4
  await page.getByRole('button', { name: /calculate atlas/i }).click();
  // Report view is reached once the report-only nav tabs mount (attached even where hidden).
  await expect(page.locator('.atlas-nav__link').first()).toBeAttached();
  // The Guided summary is the default report sub-view (docs/plans/2026-07-19…). The atlas
  // specs assert on the traditional palace grid, so switch to it via the always-present
  // "to traditional" button (works on desktop and mobile, unlike the display:none-on-mobile tabs).
  const toTraditional = page.getByTestId('guided-to-traditional');
  if (await toTraditional.count()) await toTraditional.click();
}
