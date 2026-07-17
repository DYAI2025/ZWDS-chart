import { useEffect, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { StatusStrip } from '@/components/navigation/AtlasNavigation';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';

// REQ-011 / AC-011: calculation quality, ruleset, source status, unresolved
// conventions, provenance, and the chart fingerprint MUST be visible in the
// MAIN report surface — not only inside a tooltip or the separate Evidence /
// Method tab.
//
// This test drives the REAL report surface (StatusStrip + ReportWorkspace)
// through the REAL reducer (CALCULATION_SUCCESS) seeded with the bundled
// DEMO_REPORT — the same gating AppShell applies (view === 'report' && report).
// It renders the DEFAULT report sub-view ('atlas'), never clicks a tab, never
// opens the Evidence drawer and never expands a <details>. The Evidence page is
// deliberately NOT mounted.
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
    // CALCULATION_SUCCESS leaves reportSubView at its initial value ('atlas').
  }, [dispatch]);
  return <>{children}</>;
}

// Mirrors AppShell's own gate: StatusStrip + ReportWorkspace are only mounted
// once a report exists, so no consumer dereferences a null report.
function ReportSurface() {
  const { state } = useApp();
  if (!state.report) return null;
  return (
    <>
      <StatusStrip />
      <ReportWorkspace />
    </>
  );
}

describe('AC-011 main-report visibility (component-render stage)', () => {
  it('surfaces every AC-011 quality/provenance field in the default report view without opening the Evidence tab', async () => {
    render(
      <AppProvider>
        <SeedDemoReport>
          <ReportSurface />
        </SeedDemoReport>
      </AppProvider>,
    );

    // Wait for the effect-driven dispatch to mount the report surface. Only the
    // StatusStrip carries role="status" here, so this resolves uniquely.
    await screen.findByRole('status');

    // The Evidence index page must NOT be mounted — we prove visibility on the
    // MAIN report body, not via the Evidence tab.
    expect(screen.queryByText('Evidence Index')).not.toBeInTheDocument();

    // 1. Source status (already surfaced today).
    expect(screen.getAllByText('SOURCE_NEEDED').length).toBeGreaterThanOrEqual(1);

    // 2. Ruleset id AND version, together in one element (already surfaced today).
    expect(screen.getByText(/zwds\.fufire\.core-seed\.v1 .* 0\.1\.0/)).toBeInTheDocument();

    // 3. Crosscheck status (already surfaced today).
    expect(screen.getByText('Crosscheck:')).toBeInTheDocument();

    // 4. Chart fingerprint (already surfaced today).
    expect(screen.getAllByText('fufire-fix-sha384-demo').length).toBeGreaterThanOrEqual(1);

    // 5. School profile status — the raw fixture value must appear in the main strip.
    expect(screen.getByText('NOT_SELECTED')).toBeInTheDocument();

    // 6. Script policy — the raw fixture value must appear in the main strip.
    expect(screen.getByText('TW_TRADITIONAL')).toBeInTheDocument();

    // 7. At least one provenance origin from report.provenance[].
    expect(screen.getByText('fufire-zwds-engine')).toBeInTheDocument();

    // 8. Unresolved-conventions indication (label + at least one unresolved
    //    convention id, both derived from the real calculation model).
    expect(screen.getByText('Unresolved conventions')).toBeInTheDocument();
    expect(screen.getByText('calendarPolicyId')).toBeInTheDocument();
  });
});
