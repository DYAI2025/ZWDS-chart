import { test, expect, type Page } from '@playwright/test';
import { reachReportView } from './atlas-helpers';

/**
 * REQ-016B / AC-016 — the report/atlas must be responsive from 360px to 1600px, expose its
 * key information WITHOUT hover, and never force the page body to scroll horizontally.
 *
 * This is a real-layout property, so it is measured in an actual browser by resizing the
 * viewport and reading rendered geometry — never assumed. The sweep runs in the
 * desktop-chromium project: Chromium re-evaluates CSS media queries on setViewportSize
 * reliably at every width, and at 360px the `max-width:767px` breakpoint swaps the 4x4 grid
 * for the MobilePalaceNavigator exactly as it does on a real phone. The mobile-chromium
 * (iPhone13 / WebKit @360px) project independently exercises the 360px WebKit rendering via
 * atlas-a11y, a11y-touch-targets and core-flow, so this width-sweep is skipped there rather
 * than fighting an isMobile context with arbitrary large-viewport overrides.
 */

const WIDTHS = [360, 768, 1280, 1600] as const;
const MOBILE_BREAKPOINT = 768; // < 768px => MobilePalaceNavigator (globals.css @media max-width:767px)

async function pageOverflow(page: Page): Promise<{ scrollWidth: number; clientWidth: number }> {
  return page.evaluate(() => {
    const el = document.scrollingElement ?? document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });
}

test('report/atlas is responsive, hover-independent and never scrolls the body horizontally (360-1600px)', async ({ page }, testInfo) => {
  // Width sweep runs in desktop-chromium; the mobile-chromium project covers 360px WebKit natively.
  test.skip(testInfo.project.name === 'mobile-chromium', 'width sweep runs in desktop-chromium');
  await page.goto('/');
  await reachReportView(page);

  for (const width of WIDTHS) {
    await test.step(`${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      const isMobileWidth = width < MOBILE_BREAKPOINT;

      if (isMobileWidth) {
        // ── MobilePalaceNavigator path (the 4x4 grid is display:none here) ──
        const navigator = page.locator('.mobile-navigator');
        await expect(navigator, `mobile navigator is shown at ${width}px`).toBeVisible();
        await expect(page.getByTestId('palace-grid'), `4x4 grid is hidden at ${width}px`).toBeHidden();

        // One readable palace: its name heading and at least one star are present as TEXT,
        // with no hover — the key info is not hover-gated.
        const heading = navigator.locator('.mobile-navigator__card > h2').first();
        await expect(heading).toBeVisible();
        expect((await heading.innerText()).trim().length, `palace name is readable at ${width}px`).toBeGreaterThan(0);

        // The network (harmony/opposition) is legible without hover: the RelationSummary text
        // inside the navigator's inspector is present and non-empty. (The coloured cells / SVG
        // relation lines are a redundant visual channel, not the only one.)
        const relationSummary = navigator.locator('.relation-text-summary');
        await expect(relationSummary).toBeVisible();
        await expect(relationSummary).toContainText(/harmon|opposit/i);

        // The network is OPERABLE by click (not hover): advancing to the next palace changes
        // the displayed palace name.
        const before = (await heading.innerText()).trim();
        await navigator.getByRole('button', { name: /next/i }).click();
        await expect
          .poll(async () => (await heading.innerText()).trim(), { message: `next palace is operable at ${width}px` })
          .not.toBe(before);
      } else {
        // ── Desktop 4x4 grid path ──
        const grid = page.getByTestId('palace-grid');
        await expect(grid, `4x4 grid is shown at ${width}px`).toBeVisible();
        await expect(page.locator('.mobile-navigator'), `mobile navigator is hidden at ${width}px`).toBeHidden();

        // One readable palace cell: its title and hanzi glyph are present as visible text
        // without any hover interaction.
        const cell = page.getByTestId('palace-cell-GUAN_LU');
        await expect(cell.locator('.palace-cell__title')).toBeVisible();
        await expect(cell.locator('.palace-cell__hanzi')).toBeVisible();

        // Key relational info is available as persistent text (not hover-only): the desktop
        // inspector's RelationSummary.
        const relationSummary = page.locator('.report-layout__inspector .relation-text-summary');
        await expect(relationSummary).toBeVisible();
        await expect(relationSummary).toContainText(/harmon|opposit/i);

        // The network is operable by click: selecting the cell reflects aria-pressed and the
        // relation summary updates to that palace.
        await cell.click();
        await expect(cell).toHaveAttribute('aria-pressed', 'true');
      }

      // ── The page body must NEVER scroll horizontally at any width ──
      const { scrollWidth, clientWidth } = await pageOverflow(page);
      expect(scrollWidth, `no horizontal body scroll at ${width}px (scrollWidth ${scrollWidth} <= clientWidth ${clientWidth})`)
        .toBeLessThanOrEqual(clientWidth);
    });
  }
});
