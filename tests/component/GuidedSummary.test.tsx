import { useEffect, type ReactNode } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

// globals:false in the component project → Testing Library's auto-cleanup is not wired up.
afterEach(cleanup);
import { AppProvider, useApp } from '@/app/appContext';
import { AtlasNavigation } from '@/components/navigation/AtlasNavigation';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';
import { MAX_PROMINENT_PALACES } from '@/domain/palaceProminence';

// REQ-F-001/002/003 + REQ-D-001: drive the REAL report surface through the REAL reducer
// (CALCULATION_SUCCESS) seeded with the bundled DEMO_REPORT. CALCULATION_SUCCESS lands on
// the Guided sub-view (guidedDefault flag on by default), so no tab click is needed.
function SeedDemoReport({ children }: { children: ReactNode }) {
  const { dispatch } = useApp();
  useEffect(() => {
    dispatch({
      type: 'CALCULATION_SUCCESS',
      payload: { report: DEMO_REPORT, sections: generateDemoSections(DEMO_REPORT), reportToken: null },
    });
  }, [dispatch]);
  return <>{children}</>;
}

function Surface() {
  const { state } = useApp();
  if (!state.report) return null;
  return <><AtlasNavigation /><ReportWorkspace /></>;
}

function renderGuided() {
  return render(
    <AppProvider>
      <SeedDemoReport>
        <Surface />
      </SeedDemoReport>
    </AppProvider>,
  );
}

describe('Iteration 1 — Guided Summary (component stage)', () => {
  it('opens on the Guided view and shows the personal core plus at most three prominent palaces', async () => {
    renderGuided();
    await screen.findByText('Your chart at a glance');

    // Personal core section (Ming), classified CALCULATED.
    expect(screen.getByText('Your personal core')).toBeInTheDocument();

    // Prominent palaces — the exact three the rule selects from the demo chart, capped at three.
    const cards = await screen.findByTestId('guided-prominent-cards');
    const rendered = cards.querySelectorAll('[data-testid^="guided-prominent-"]');
    expect(rendered.length).toBeLessThanOrEqual(MAX_PROMINENT_PALACES);
    expect(screen.getByTestId('guided-prominent-TIAN_ZHAI')).toBeInTheDocument();
    expect(screen.getByTestId('guided-prominent-XIONG_DI')).toBeInTheDocument();
    expect(screen.getByTestId('guided-prominent-QIAN_YI')).toBeInTheDocument();
    // Ming is the personal core, never a prominence card.
    expect(screen.queryByTestId('guided-prominent-MING')).not.toBeInTheDocument();
  });

  it('marks each prominent card as a plain-language product translation, never a strength score', () => {
    renderGuided();
    // No card renders a numeric "score" or a "strongest" claim.
    expect(screen.queryByText(/strongest/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Plain-language explanation').length).toBeGreaterThanOrEqual(1);
  });

  it('states prominently that prominent does not mean good or bad (REQ-F, the critical non-verdict)', () => {
    renderGuided();
    expect(screen.getByTestId('guided-not-verdict')).toHaveTextContent(/does not automatically mean good or bad/i);
  });

  it('lets the user switch to the traditional atlas view (REQ-F-002)', async () => {
    renderGuided();
    await screen.findByTestId('guided-to-traditional');
    fireEvent.click(screen.getByTestId('guided-to-traditional'));
    // The traditional palace grid is now mounted.
    expect(await screen.findByTestId('palace-grid')).toBeInTheDocument();
    expect(screen.queryByText('Your chart at a glance')).not.toBeInTheDocument();
  });
});
