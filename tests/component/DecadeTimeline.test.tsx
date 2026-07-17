import { useEffect, type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { PalaceGrid, DecadeTimeline } from '@/components/atlas/PalaceWorkspace';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';
import type { NormalizedZwdsReport, PalaceId } from '@/domain/zwdsTypes';

// REQ-012 / AC-012: selecting a decadal (ten-year) window must HIGHLIGHT the
// related palace WHILE the natal placements stay UNCHANGED (highlight != over-
// write), and the age-reckoning metadata (age ranges + age_reckoning_id) must be
// preserved and visible — never silently dropped.
//
// This test drives the REAL DecadeTimeline + PalaceGrid through the REAL reducer
// (CALCULATION_SUCCESS) seeded with the bundled DEMO_REPORT — the same rebuilt
// placement map server/normalize.mjs produces from the real FuFirE fixture — so
// fixture-mode and bff-mode carry identical age-reckoning metadata.

// A no-render probe that mirrors the live reducer state into module scope, so the
// test can snapshot report.palaces / report.stars across a decade selection.
interface Probe {
  report: NormalizedZwdsReport | null;
  selectedPalaceId: PalaceId | null;
  selectedDecadeIndex: number | null;
}

function makeProbe(): { probe: Probe; StateProbe: () => null } {
  const probe: Probe = { report: null, selectedPalaceId: null, selectedDecadeIndex: null };
  function StateProbe(): null {
    const { state } = useApp();
    probe.report = state.report;
    probe.selectedPalaceId = state.selectedPalaceId;
    probe.selectedDecadeIndex = state.selectedDecadeIndex;
    return null;
  }
  return { probe, StateProbe };
}

// Seeds the REAL app reducer with a report via the real CALCULATION_SUCCESS action.
function Seed({ report, children }: { report: NormalizedZwdsReport; children: ReactNode }) {
  const { dispatch } = useApp();
  useEffect(() => {
    dispatch({
      type: 'CALCULATION_SUCCESS',
      payload: { report, sections: generateDemoSections(DEMO_REPORT), reportToken: null },
    });
  }, [dispatch, report]);
  return <>{children}</>;
}

// Mirrors AppShell's own gate: PalaceGrid / DecadeTimeline only mount once a report
// exists, so no consumer dereferences a null report.
function Surface({ children }: { children: ReactNode }) {
  const { state } = useApp();
  if (!state.report) return null;
  return <>{children}</>;
}

// TIAN_ZHAI is the 4th decade window (decadePalaces index 3 -> decade.index 4) and
// carries natal PO_JUN(HUA_QUAN)/WU_QU(HUA_KE), so its selection is observable both
// as a highlight change AND as a natal-placement that must NOT be rewritten.
const TIAN_ZHAI_DECADE_TAB_INDEX = 3;

// With vitest globals:false, @testing-library/react does not auto-register its
// afterEach cleanup, so unmount the previous tree between the three cases to keep
// the DOM (tablist, palace-grid) unique per test.
afterEach(cleanup);

describe('AC-012 decade selection (component-render stage)', () => {
  it('highlights the decade palace WITHOUT overwriting natal palaces/stars (highlight != overwrite)', async () => {
    const { probe, StateProbe } = makeProbe();
    render(
      <AppProvider>
        <Seed report={DEMO_REPORT}>
          <StateProbe />
          <Surface>
            <PalaceGrid />
            <DecadeTimeline />
          </Surface>
        </Seed>
      </AppProvider>,
    );

    // Wait for the effect-driven CALCULATION_SUCCESS dispatch to seed the report.
    await screen.findByRole('tablist');
    await waitFor(() => expect(probe.report).not.toBeNull());
    const report = probe.report!;

    // Initial selection is the MING palace, NOT TIAN_ZHAI.
    expect(probe.selectedPalaceId).toBe('MING');
    const tianZhaiCellBefore = screen.getByTestId('palace-cell-TIAN_ZHAI');
    expect(tianZhaiCellBefore.className).not.toContain('palace-cell--selected');

    // Deep, byte-level snapshot of the natal placement truth BEFORE decade selection.
    const palacesBefore = JSON.stringify(report.palaces);
    const starsBefore = JSON.stringify(report.stars);

    // Select the TIAN_ZHAI decade window (dispatches SELECT_DECADE + SELECT_PALACE).
    const decadeTabs = screen.getAllByRole('tab');
    expect(decadeTabs).toHaveLength(12);
    fireEvent.click(decadeTabs[TIAN_ZHAI_DECADE_TAB_INDEX]);

    // The decade + its related palace become the active selection (the highlight).
    await waitFor(() => expect(probe.selectedDecadeIndex).toBe(4));
    expect(probe.selectedPalaceId).toBe('TIAN_ZHAI');

    // The related palace cell now shows the selected/highlighted state.
    const tianZhaiCellAfter = screen.getByTestId('palace-cell-TIAN_ZHAI');
    expect(tianZhaiCellAfter.className).toContain('palace-cell--selected');
    expect(tianZhaiCellAfter).toHaveAttribute('aria-pressed', 'true');
    expect(decadeTabs[TIAN_ZHAI_DECADE_TAB_INDEX]).toHaveAttribute('aria-selected', 'true');

    // The natal placements must be BYTE-IDENTICAL — a decade selection highlights,
    // it never overwrites the chart's palaces or star placements.
    expect(JSON.stringify(probe.report!.palaces)).toBe(palacesBefore);
    expect(JSON.stringify(probe.report!.stars)).toBe(starsBefore);
  });

  it('surfaces the real age-reckoning metadata (age ranges + age_reckoning_id) for the decade windows', async () => {
    render(
      <AppProvider>
        <Seed report={DEMO_REPORT}>
          <Surface>
            <DecadeTimeline />
          </Surface>
        </Seed>
      </AppProvider>,
    );

    await screen.findByRole('tablist');
    const tabs = screen.getAllByRole('tab');

    // The decade age ranges (ageStart-ageEnd) must render verbatim. Decade 1 spans
    // ages 6-15; the 4th window (TIAN_ZHAI) spans 36-45. The separator is an en dash.
    expect(tabs[0].querySelector('.decade-item__age')?.textContent).toBe(`6${'–'}15`);
    expect(tabs[TIAN_ZHAI_DECADE_TAB_INDEX].querySelector('.decade-item__age')?.textContent).toBe(`36${'–'}45`);

    // The age_reckoning_id carried by the REAL fixture must be surfaced, not dropped.
    expect(screen.getByText('east_asian_nominal.guide-v1')).toBeInTheDocument();
  });

  it('renders nothing and does not throw when decades is null', async () => {
    const noDecades: NormalizedZwdsReport = { ...DEMO_REPORT, decades: null };
    render(
      <AppProvider>
        <Seed report={noDecades}>
          <Surface>
            <PalaceGrid />
            <DecadeTimeline />
          </Surface>
        </Seed>
      </AppProvider>,
    );

    // PalaceGrid mounting proves the (decades: null) report was seeded and rendered.
    await screen.findByTestId('palace-grid');

    // DecadeTimeline returned null: no timeline, no age-reckoning row, no throw.
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByText('east_asian_nominal.guide-v1')).toBeNull();
  });
});
