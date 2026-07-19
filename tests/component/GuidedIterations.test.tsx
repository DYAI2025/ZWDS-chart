import { useEffect, type ReactNode } from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import { GuidedLifePhase } from '@/components/guided/GuidedLifePhase';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';

afterEach(cleanup);

// Seeds the bundled DEMO_REPORT through the REAL reducer, then gates children on the report
// being present (mirrors AppShell). CALCULATION_SUCCESS lands on the Guided sub-view.
function Seeded({ children }: { children: ReactNode }) {
  const { state, dispatch } = useApp();
  useEffect(() => {
    dispatch({
      type: 'CALCULATION_SUCCESS',
      payload: { report: DEMO_REPORT, sections: generateDemoSections(DEMO_REPORT), reportToken: null },
    });
  }, [dispatch]);
  return state.report ? <>{children}</> : null;
}

function renderNode(node: ReactNode) {
  return render(<AppProvider><Seeded>{node}</Seeded></AppProvider>);
}

describe('Iteration 2 — guided relations (component)', () => {
  it('shows harmony and opposition for the personal core, as plain text (no colour dependency)', async () => {
    renderNode(<ReportWorkspace />);
    await screen.findByTestId('guided-relations');
    // Ming is the default focus and has both a harmony group and an opposition in the demo chart.
    expect(screen.getByTestId('guided-relations-harmony')).toBeInTheDocument();
    expect(screen.getByTestId('guided-relations-opposition')).toBeInTheDocument();
    // The relation is conveyed in words (a heading with a named area), not only by a line/colour.
    expect(screen.getByTestId('guided-relations-harmony').textContent).toMatch(/\w+/);
  });
});

describe('Iteration 3 — current life chapter (component)', () => {
  it('resolves the active chapter for a known age and marks it as context, not an event', async () => {
    renderNode(<GuidedLifePhase currentAgeOverride={42} />);
    await screen.findByTestId('guided-phase-resolved');
    expect(screen.getByText('36–45')).toBeInTheDocument();
    expect(screen.getByTestId('guided-phase-not-event')).toBeInTheDocument();
  });

  it('names the missing basis instead of guessing when the chapter is undeterminable', async () => {
    renderNode(<GuidedLifePhase currentAgeOverride={999} />);
    expect(await screen.findByTestId('guided-phase-unknown')).toBeInTheDocument();
    expect(screen.queryByTestId('guided-phase-resolved')).not.toBeInTheDocument();
  });
});

describe('Iteration 4 — evidence-bound reflection (component)', () => {
  it('binds a theme answer to the chart and offers a "how was this calculated?" path', async () => {
    renderNode(<ReportWorkspace />);
    await screen.findByTestId('guided-reflect');
    fireEvent.click(screen.getByTestId('guided-reflect-theme-WORK'));
    const answer = await screen.findByTestId('guided-reflect-answer');
    expect(answer).toBeInTheDocument();
    // The basis names a concrete chart entity.
    expect(screen.getByTestId('guided-reflect-basis').textContent?.length).toBeGreaterThan(0);
    // Reflection is flagged as a reflective hypothesis, never a traditional/original claim.
    expect(screen.getAllByText('Reflective Hypothesis').length).toBeGreaterThanOrEqual(1);
  });

  it('keeps note persistence off until a deletion policy exists', async () => {
    renderNode(<ReportWorkspace />);
    expect(await screen.findByTestId('guided-reflect-persistence-off')).toBeInTheDocument();
  });
});
