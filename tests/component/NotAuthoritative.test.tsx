import { useEffect, type ReactNode } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';
import type { NormalizedZwdsReport } from '@/domain/zwdsTypes';

// AMD-002 / RISK-005: until the interpretation catalog / ruleset is signed off by
// a source-governance reviewer, ALL public report output must carry a persistent,
// prominent "illustrative, unreviewed — not authoritative" notice. The signal is
// derived HONESTLY from the real model — the notice shows whenever the calculation
// is NOT genuinely source-reviewed (sourceStatus !== 'SOURCE_REVIEWED'). The bundled
// DEMO_REPORT is SOURCE_NEEDED, so it must show; a SOURCE_REVIEWED report must not.
//
// This drives the REAL report surface (ReportWorkspace) through the REAL reducer
// (CALCULATION_SUCCESS). It renders the DEFAULT report sub-view ('atlas'), never
// clicks a tab, never opens the Evidence drawer and never expands a <details>.
function SeedReport({ report, children }: { report: NormalizedZwdsReport; children: ReactNode }) {
  const { dispatch } = useApp();
  useEffect(() => {
    dispatch({
      type: 'CALCULATION_SUCCESS',
      payload: {
        report,
        sections: generateDemoSections(report),
        reportToken: null,
      },
    });
    // CALCULATION_SUCCESS leaves reportSubView at its initial value ('atlas').
  }, [dispatch, report]);
  return <>{children}</>;
}

function ReportSurface() {
  const { state } = useApp();
  if (!state.report) return null;
  return <ReportWorkspace />;
}

// A genuinely source-reviewed variant: the ONLY value that hides the notice is the
// one that means the source really was reviewed. Nothing else can spoof it away.
const REVIEWED_REPORT: NormalizedZwdsReport = {
  ...DEMO_REPORT,
  calculation: { ...DEMO_REPORT.calculation, sourceStatus: 'SOURCE_REVIEWED' },
};

// vitest runs with globals:false, so Testing Library's auto-cleanup is not
// registered. This file has two `it`s that both mount the report surface, so the
// first render would bleed into the second (stale notice + duplicate headings)
// without an explicit unmount between tests.
afterEach(cleanup);

describe('AMD-002 not-authoritative release gate (component-render stage)', () => {
  it('shows the not-authoritative notice on the MAIN report while sourceStatus is SOURCE_NEEDED, without opening a tab or details', async () => {
    render(
      <AppProvider>
        <SeedReport report={DEMO_REPORT}>
          <ReportSurface />
        </SeedReport>
      </AppProvider>,
    );

    // The notice must be on the default 'atlas' sub-view — no tab click, no drawer.
    const notice = await screen.findByTestId('report-not-authoritative');
    expect(notice).toBeInTheDocument();

    // The Evidence index page must NOT be mounted — the notice lives on the MAIN body.
    expect(screen.queryByText('Evidence Index')).not.toBeInTheDocument();

    // Honest, bilingual (EN default) wording must be visible verbatim.
    expect(screen.getByText(/Illustrative, unreviewed/)).toBeInTheDocument();
    expect(screen.getByText(/not an authoritative traditional-school reading/)).toBeInTheDocument();

    // It must NOT be gated behind a <details>/<summary> disclosure.
    expect(notice.closest('details')).toBeNull();
    expect(document.querySelector('details')).toBeNull();
  });

  it('hides the notice once the report is genuinely SOURCE_REVIEWED', async () => {
    render(
      <AppProvider>
        <SeedReport report={REVIEWED_REPORT}>
          <ReportSurface />
        </SeedReport>
      </AppProvider>,
    );

    // Wait for the effect-driven dispatch to render the report body. The provenance
    // panel's "Unresolved conventions" heading is always present on the default view
    // once a report is in state (and is unique — see MainReportVisibility).
    await screen.findByText('Unresolved conventions');

    expect(screen.queryByTestId('report-not-authoritative')).not.toBeInTheDocument();
    expect(screen.queryByText(/Illustrative, unreviewed/)).not.toBeInTheDocument();
  });
});
