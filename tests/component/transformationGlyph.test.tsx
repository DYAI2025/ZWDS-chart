import { useEffect, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { PalaceGrid } from '@/components/atlas/PalaceWorkspace';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';

// CONTRA-001 BFF<->FE wire guard (reviewer-requested).
//
// RECON-server re-founded the server data contract on the REAL FuFirE response,
// which emits the canonical transformation id HUA_QUAN (化權). The FE previously
// spoke the fabricated alias HUA_QU and had no catalogue entry for the real id, so
// in VITE_DATA_MODE=bff the real Quan transformation resolved to the '?' fallback —
// an isolation gap between the two data modes.
//
// This test drives the rebuilt DEMO_REPORT (which now carries PO_JUN(HUA_QUAN) in
// TIAN_ZHAI, exactly as server/normalize.mjs normalizeRaw() produces from the real
// fixture) through the REAL PalaceGrid + reducer, and asserts the Quan transformation
// resolves to the real glyph 化權 — never '?'. This is the guard that the isolation
// gap cannot silently recur.
function SeedDemoReport({ children }: { children: ReactNode }) {
  const { dispatch } = useApp();
  useEffect(() => {
    dispatch({
      type: 'CALCULATION_SUCCESS',
      payload: {
        report: DEMO_REPORT,
        sections: generateDemoSections(DEMO_REPORT),
        reportToken: null,
      },
    });
  }, [dispatch]);
  return <>{children}</>;
}

// Mirrors AppShell's own gate: PalaceGrid dereferences state.report, so it is only
// mounted once a report exists (after the effect-driven CALCULATION_SUCCESS dispatch).
function ReportSurface() {
  const { state } = useApp();
  if (!state.report) return null;
  return <PalaceGrid />;
}

describe('CONTRA-001 BFF<->FE transformation glyph wire (component-render stage)', () => {
  it('resolves the canonical HUA_QUAN transformation to 化權, not the ? isolation-gap fallback', async () => {
    const { container } = render(
      <AppProvider>
        <SeedDemoReport>
          <ReportSurface />
        </SeedDemoReport>
      </AppProvider>,
    );

    // Wait for the effect-driven CALCULATION_SUCCESS dispatch to mount the grid.
    // TIAN_ZHAI carries PO_JUN(HUA_QUAN) (and WU_QU(HUA_KE)) in the rebuilt DEMO_REPORT.
    const tianZhaiCell = await screen.findByTestId('palace-cell-TIAN_ZHAI');

    // The HUA_QUAN transformation chip must render the REAL Hanzi glyph, not '?'.
    const quanChip = tianZhaiCell.querySelector('.palace-cell__transformation--hua-quan');
    expect(quanChip, 'HUA_QUAN transformation chip must be rendered').not.toBeNull();
    expect(quanChip?.textContent).toBe('化權');

    // Reviewer guard: no transformation chip anywhere in the grid may fall through to
    // the '?' fallback — that fallback IS the isolation gap this increment closes.
    const chips = container.querySelectorAll('.palace-cell__transformation');
    expect(chips.length).toBeGreaterThanOrEqual(4);
    for (const chip of chips) {
      expect(chip.textContent, `transformation chip "${chip.className}" resolved to '?'`).not.toBe('?');
    }

    // And the canonical Quan glyph is genuinely present in the rendered tree.
    expect(screen.getAllByText('化權').length).toBeGreaterThanOrEqual(1);
  });
});
