import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { reachReportView } from './atlas-helpers';

/**
 * REQ-016B / AC-016 — reality-grounded accessibility of the ACTUAL report/atlas view.
 *
 * The pre-existing @a11y coverage (core-flow.spec.ts) runs axe on the LANDING page only.
 * AC-016 requires the report/atlas itself to be usable by keyboard, at 200% zoom and with
 * reduced motion. These specs reach the real report via the demo intake path and run
 * @axe-core/playwright against it in a real browser — never jsdom.
 *
 * 200% zoom emulation
 * -------------------
 * We set `document.documentElement.style.zoom = '2'`. This is Blink/WebKit's own zoom
 * mechanism (unlike `transform: scale()` it PARTICIPATES in layout, so overflow/overlap
 * regressions surface) and is deterministic in headless Chromium and WebKit. CSS `zoom`
 * scales every box to 2x while leaving media-query evaluation at the unzoomed viewport,
 * which is exactly what we want here: the desktop 4x4 palace grid stays mounted and is
 * therefore exercised by axe at 2x (a plain narrow viewport would collapse it to the
 * mobile navigator). The complementary reflow-to-narrow behaviour is covered faithfully
 * by responsive.spec.ts, which halves the viewport instead. The test asserts the grid is
 * still visible under zoom so the 2x scan can never pass vacuously.
 */

const SERIOUS = ['critical', 'serious'];

function seriousViolations(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return results.violations
    .filter((violation) => SERIOUS.includes(violation.impact ?? ''))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target).flat(),
    }));
}

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
}

test('@a11y report/atlas view is axe-clean at default and at 200% zoom + reduced motion', async ({ page }, testInfo) => {
  test.slow(); // multiple full axe scans (default + 200% zoom); 30s is too tight under 4-worker CPU contention. 3x timeout, deterministic — not relying on CI retries to mask a timeout.
  const isMobile = testInfo.project.name === 'mobile-chromium';
  await page.goto('/');
  await reachReportView(page);

  // The correct layout for this breakpoint must actually be on screen before we scan,
  // so a passing axe result is never vacuous.
  if (isMobile) {
    await expect(page.locator('.mobile-navigator')).toBeVisible();
  } else {
    await expect(page.getByTestId('palace-grid')).toBeVisible();
  }

  const atDefault = seriousViolations(await scan(page));
  expect(atDefault, `serious/critical axe violations on report (default, ${testInfo.project.name})`).toEqual([]);

  // 200% zoom + reduced motion.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });

  if (!isMobile) {
    // CSS zoom leaves media queries at the unzoomed width, so the 4x4 grid stays mounted
    // and is genuinely exercised at 2x rather than collapsing to the mobile navigator.
    await expect(page.getByTestId('palace-grid')).toBeVisible();
  }

  const atZoom = seriousViolations(await scan(page));
  expect(atZoom, `serious/critical axe violations on report (200% zoom + reduced motion, ${testInfo.project.name})`).toEqual([]);

  await page.evaluate(() => { document.documentElement.style.zoom = ''; });
});

test('@a11y report reading / evidence / method sub-views are axe-clean', async ({ page }, testInfo) => {
  test.slow(); // three sub-view axe scans; 3x timeout for determinism under parallel load.
  // The report sub-view tabs are the desktop atlas-nav links (display:none on mobile, where
  // the mobile navigator is the single surface). Drive the tab sweep on desktop only.
  test.skip(testInfo.project.name === 'mobile-chromium', 'report nav tabs are desktop-only; mobile covered by the atlas-view spec');
  await page.goto('/');
  await reachReportView(page);

  for (const sub of ['reading', 'evidence', 'method'] as const) {
    await page.getByRole('tab', { name: new RegExp(sub, 'i') }).click();
    const violations = seriousViolations(await scan(page));
    expect(violations, `serious/critical axe violations on '${sub}' sub-view`).toEqual([]);
  }
});

test('atlas is keyboard-operable: Tab reaches a palace, Enter selects, focus is retained', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'the 4x4 palace grid is desktop-only; mobile uses the MobilePalaceNavigator prev/next controls');
  await page.goto('/');
  await reachReportView(page);
  await expect(page.getByTestId('palace-grid')).toBeVisible();

  // Tab from the top of the document until focus lands on a palace cell. A bounded loop
  // proves the cells are genuinely in the tab order (not tabindex=-1 / not focus-trapped
  // before them), without hard-coding the exact tab count of the surrounding chrome.
  let focusedTestId: string | null = null;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    focusedTestId = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.classList.contains('palace-cell') ? el.getAttribute('data-testid') : null;
    });
    if (focusedTestId) break;
  }
  expect(focusedTestId, 'a palace cell is reachable by keyboard Tab').toMatch(/^palace-cell-/);

  const cell = page.getByTestId(focusedTestId!);
  await page.keyboard.press('Enter');

  // Enter activates the cell -> aria-pressed reflects selection.
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  // Focus must NOT be lost across the React re-render triggered by selection.
  const stillFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  expect(stillFocused, 'focus is retained on the activated palace cell').toBe(focusedTestId);
});

test('atlas Space also selects a palace and keeps focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'the 4x4 palace grid is desktop-only');
  await page.goto('/');
  await reachReportView(page);
  await expect(page.getByTestId('palace-grid')).toBeVisible();

  // Focus a specific, deterministic cell, then activate with Space.
  const cell = page.getByTestId('palace-cell-GUAN_LU');
  await cell.focus();
  await page.keyboard.press('Space');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  const stillFocused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
  expect(stillFocused).toBe('palace-cell-GUAN_LU');
});

test('atlas live region announces the selection AND its harmony/opposition relations (REQ-008)', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium', 'exercised via the desktop grid; the same live region serves both layouts');
  await page.goto('/');
  await reachReportView(page);
  await expect(page.getByTestId('palace-grid')).toBeVisible();

  const liveRegion = page.getByTestId('atlas-live-region');
  // Scope to the visible desktop inspector; the MobilePalaceNavigator renders a second
  // (display:none) PalaceInspector with the same classes.
  const inspectorTitle = page.locator('.report-layout__inspector .inspector__palace-title');

  // Select a palace by keyboard.
  const cell = page.getByTestId('palace-cell-GUAN_LU');
  await cell.focus();
  await page.keyboard.press('Enter');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');

  // The announcement names the selected palace...
  const selectedName = (await inspectorTitle.innerText()).trim();
  await expect(liveRegion).toContainText(selectedName);

  // ...and, crucially, its calculated relationships — not only the name (the REQ-008 gap).
  // Cross-check against the on-screen RelationSummary so the assertion tracks the REAL
  // computed relations rather than a hard-coded fixture expectation.
  const harmonyLine = (await page.locator('.report-layout__inspector .relation-text-summary p').first().innerText()).trim();
  // Format: "In harmony with: <Name> · <hanzi>, <Name> · <hanzi>"  (or trailing "—" when none)
  const harmonyLabel = harmonyLine.split(':')[0].trim();
  const harmonyNames = harmonyLine
    .slice(harmonyLine.indexOf(':') + 1)
    .split(',')
    .map((chunk) => chunk.split('·')[0].trim())
    .filter((name) => name && name !== '—');

  expect(harmonyNames.length, 'the fixture palace has calculated harmony relations to announce').toBeGreaterThan(0);
  await expect(liveRegion).toContainText(harmonyLabel);
  for (const name of harmonyNames) {
    await expect(liveRegion).toContainText(name);
  }
});
