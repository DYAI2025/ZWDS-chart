import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * REQ-016A / AC-016 — Touch-target sizing.
 *
 * Every interactive control that a user taps must present at least a 44x44 CSS-px
 * hit area (WCAG 2.5.5 / Apple HIG / Material). This is a REAL-layout property, so it
 * is measured with Playwright's boundingBox() in an actual browser — never faked in
 * jsdom and never asserted against an assumed size. Runs in both configured projects
 * (desktop-chromium and the 360px mobile-chromium project) so the mobile breakpoint,
 * where touch matters most, is exercised.
 *
 * Only VISIBLE controls are measured: some controls are deliberately hidden per
 * breakpoint (the atlas nav tabs and the palace grid are display:none on mobile, where
 * a dedicated mobile navigator replaces them), and a control with no rendered box has
 * no touch target to size. DOM presence is asserted separately so the check can never
 * pass vacuously.
 */

const MIN_TOUCH_PX = 44;
// Sub-pixel tolerance: a control pinned to `min-height: 44px` renders at exactly 44 CSS px,
// but boundingBox() can report e.g. 43.99 under fractional device scaling. 0.5 is far below
// the gap to the real regressions (36px / ~26px), so it never masks an undersized control.
const TOLERANCE_PX = 0.5;

interface Undersized {
  index: number;
  width: number;
  height: number;
}

/**
 * Measures every visible element matching `selector` within `scope` and returns the ones
 * whose rendered box is smaller than the 44px minimum in either dimension, plus totals
 * for coverage assertions. Hidden / unrendered elements are skipped, not failed.
 */
async function measureTouchTargets(scope: Page | Locator, selector: string): Promise<{
  total: number;
  visibleChecked: number;
  undersized: Undersized[];
}> {
  const locator = scope.locator(selector);
  const total = await locator.count();
  const undersized: Undersized[] = [];
  let visibleChecked = 0;

  for (let index = 0; index < total; index++) {
    const element = locator.nth(index);
    if (!(await element.isVisible())) continue;
    const box = await element.boundingBox();
    if (!box) continue;
    visibleChecked++;
    if (box.width < MIN_TOUCH_PX - TOLERANCE_PX || box.height < MIN_TOUCH_PX - TOLERANCE_PX) {
      undersized.push({
        index,
        width: Math.round(box.width * 100) / 100,
        height: Math.round(box.height * 100) / 100,
      });
    }
  }

  return { total, visibleChecked, undersized };
}

/** Walks the demo intake path to the report view (same fixture path as core-flow, but without
 *  the ambiguous privacy-notice text selector — the consent checkbox is toggled directly). */
async function reachReportView(page: Page): Promise<void> {
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await page.getByRole('button', { name: /next/i }).click(); // step 0 → 1
  await page.getByRole('button', { name: /next/i }).click(); // step 1 → 2
  await page.getByRole('button', { name: /next/i }).click(); // step 2 → 3
  await page.getByLabel(/i have read/i).check();             // privacy consent
  await page.getByRole('button', { name: /next/i }).click(); // step 3 → 4
  await page.getByRole('button', { name: /calculate atlas/i }).click();
  // Report view is reached once the report-only nav tabs mount (attached even where hidden).
  await expect(page.locator('.atlas-nav__link').first()).toBeAttached();
}

test('every interactive control meets the 44px minimum touch target (REQ-016A)', async ({ page }) => {
  await page.goto('/');

  // ── Landing: the language switch lives in the persistent nav ──
  const langLanding = await measureTouchTargets(page, '.lang-switch__btn');
  expect(langLanding.total, 'language-switch buttons render on landing').toBeGreaterThan(0);
  expect.soft(langLanding.undersized, 'undersized language-switch buttons (landing)').toEqual([]);

  // ── Intake wizard: the step-indicator tabs ──
  await page.getByRole('button', { name: /create your atlas/i }).click();
  await expect(page.locator('.intake__step-indicator').first()).toBeVisible();
  const stepIndicators = await measureTouchTargets(page, '.intake__step-indicator');
  expect(stepIndicators.total, 'step-indicator tabs render in intake').toBeGreaterThan(0);
  expect(stepIndicators.visibleChecked, 'at least one visible step-indicator is measured').toBeGreaterThan(0);
  expect.soft(stepIndicators.undersized, 'undersized intake step-indicators').toEqual([]);

  // ── Report view: nav tabs, language switch, small buttons, palace cells ──
  // Fresh start so the intake path is deterministic from the landing state.
  await page.goto('/');
  await reachReportView(page);

  const navTabs = await measureTouchTargets(page, '.atlas-nav__link');
  expect(navTabs.total, 'atlas nav tabs are present in the DOM (report view)').toBeGreaterThan(0);
  expect.soft(navTabs.undersized, 'undersized atlas nav tabs').toEqual([]);

  const langReport = await measureTouchTargets(page, '.lang-switch__btn');
  expect.soft(langReport.undersized, 'undersized language-switch buttons (report)').toEqual([]);

  const smallButtons = await measureTouchTargets(page, '.btn--small');
  expect(smallButtons.total, 'small buttons are present in the report view').toBeGreaterThan(0);
  expect(smallButtons.visibleChecked, 'at least one visible small button is measured').toBeGreaterThan(0);
  expect.soft(smallButtons.undersized, 'undersized .btn--small buttons').toEqual([]);

  const palaceCells = await measureTouchTargets(page, '.palace-cell');
  expect(palaceCells.total, 'palace cells are present in the DOM (report view)').toBeGreaterThan(0);
  expect.soft(palaceCells.undersized, 'undersized palace cells').toEqual([]);
});
