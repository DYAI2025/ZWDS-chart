import { render } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { AppProvider } from '@/app/appContext';
import { AtlasLanding } from '@/components/hero/AtlasLanding';
import { BirthIntakeWizard } from '@/components/intake/BirthIntakeWizard';

// Deploy-verify finding (2026-07-18): on the live Railway deploy (VITE_DATA_MODE=bff)
// the landing + intake still rendered the fixture-only demo notices unconditionally —
// "Demo mode: a fixed example chart. Your entries are not recalculated." — which is
// FALSE in live mode (a Berlin profile produced a genuinely recalculated chart with a
// distinct fingerprint). These notices must appear ONLY in fixture mode. This guard
// pins that the demo/mock labels are gated on isFixtureMode() (see providerFactory).
function renderIn(mode: 'fixture' | 'bff', ui: React.ReactElement) {
  vi.stubEnv('VITE_DATA_MODE', mode);
  return render(<AppProvider>{ui}</AppProvider>);
}

afterEach(() => vi.unstubAllEnvs());

describe('demo-mode labels are gated on fixture mode', () => {
  it('fixture mode shows the landing demo note and the intake demo banner', () => {
    const landing = renderIn('fixture', <AtlasLanding />);
    expect(landing.container.querySelector('.hero__demo-note')).not.toBeNull();

    const intake = renderIn('fixture', <BirthIntakeWizard />);
    expect(intake.container.querySelector('.demo-banner')).not.toBeNull();
  });

  it('bff/live mode hides the demo note and demo banner (they would be false)', () => {
    const landing = renderIn('bff', <AtlasLanding />);
    expect(landing.container.querySelector('.hero__demo-note')).toBeNull();

    const intake = renderIn('bff', <BirthIntakeWizard />);
    expect(intake.container.querySelector('.demo-banner')).toBeNull();
  });
});
