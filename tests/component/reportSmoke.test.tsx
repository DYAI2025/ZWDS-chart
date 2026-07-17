import { useEffect, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AppProvider, useApp } from '@/app/appContext';
import { StatusStrip } from '@/components/navigation/AtlasNavigation';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';

// Seeds the REAL app reducer with the bundled DEMO report via the real
// CALCULATION_SUCCESS action — no mocked context, no mocked component.
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

describe('report surface smoke (component-render stage)', () => {
  it('renders StatusStrip against the DEMO_REPORT fixture with truthful DOM output', async () => {
    render(
      <AppProvider>
        <SeedDemoReport>
          <StatusStrip />
        </SeedDemoReport>
      </AppProvider>,
    );

    // StatusStrip renders nothing until a report is in state; findBy* waits for
    // the effect-driven dispatch to re-render the real component tree.
    const calculationStatus = await screen.findByText('DEMO_FIXTURE');
    expect(calculationStatus).toBeInTheDocument();

    // The status region itself must exist and carry the demo-mode marker class,
    // which is derived from the fixture's dataMode === 'fixture'.
    const statusRegion = screen.getByRole('status');
    expect(statusRegion).toHaveClass('status-strip--demo');

    // The chart fingerprint from the fixture must be rendered verbatim.
    expect(screen.getByText('fufire-fix-sha384-demo')).toBeInTheDocument();

    // SOURCE_NEEDED appears for both sourceStatus and crosscheckStatus in the
    // fixture, so at least two truthful occurrences must be in the DOM.
    expect(screen.getAllByText('SOURCE_NEEDED').length).toBeGreaterThanOrEqual(2);
  });
});
