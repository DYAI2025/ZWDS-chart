import type { ZwdsDataProvider } from '@/domain/zwdsTypes';
import { MockZwdsProvider } from '@/services/MockZwdsProvider';
import { BffZwdsProvider } from '@/services/BffZwdsProvider';

// ── Provider factory ───────────────────────────────────────
// VITE_DATA_MODE=fixture → bundled golden-fixture provider (default)
// VITE_DATA_MODE=bff     → Express BFF (fixture or live upstream)
export type DataMode = 'fixture' | 'bff';

export function getDataMode(): DataMode {
  const mode = import.meta.env.VITE_DATA_MODE;
  if (mode === 'bff') return 'bff';
  return 'fixture';
}

export function createProvider(): ZwdsDataProvider {
  return getDataMode() === 'bff' ? new BffZwdsProvider() : new MockZwdsProvider();
}

/** Display label used by loading/demo notices. */
export function getDataModeLabel(): 'fixture' | 'live' {
  return getDataMode() === 'bff' ? 'live' : 'fixture';
}
