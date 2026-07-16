import type {
  ZwdsDataProvider, NormalizedZwdsReport, ZwdsBirthInput, ReportSection, Locale, ZwdsCalculationResult, GeocodeResult,
} from '@/domain/zwdsTypes';
import { DEMO_REPORT, generateDemoSections } from '@/data/mockZwdsReport';

// ── Fixture-backed demo provider ───────────────────────────
// Returns the bundled golden-fixture bundle asynchronously.
// NEVER claims a live calculation:
//   - calculation.dataMode is 'fixture'
//   - truth class DEMO_FIXTURE marks every demo section
//   - input fields are echoed from the fixed demo profile
// Fixture mode never calls any BFF endpoint.

export class ProviderError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;
  constructor(code: string, message: string, isRetryable = false) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

const SIMULATED_DELAY_MS = 900;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export class MockZwdsProvider implements ZwdsDataProvider {
  async geocode(query: string, _language: 'de' | 'en', options?: { signal?: AbortSignal }): Promise<GeocodeResult[]> {
    await delay(120, options?.signal);
    const locations: GeocodeResult[] = [
      { displayName: 'Shanghai, China', lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', providerId: 'fixture-gazetteer', confidence: 1 },
      { displayName: 'Taipei, Taiwan', lat: 25.033, lon: 121.5654, timezone: 'Asia/Taipei', providerId: 'fixture-gazetteer', confidence: 1 },
      { displayName: 'Berlin, Germany', lat: 52.52, lon: 13.405, timezone: 'Europe/Berlin', providerId: 'fixture-gazetteer', confidence: 1 },
    ];
    const normalized = query.toLocaleLowerCase();
    return locations.filter((location) => location.displayName.toLocaleLowerCase().includes(normalized));
  }

  readonly mode = 'fixture' as const;

  async calculate(input: ZwdsBirthInput, options?: { signal?: AbortSignal }): Promise<ZwdsCalculationResult> {
    await delay(SIMULATED_DELAY_MS, options?.signal);
    void input; // acknowledged, never recalculated in fixture mode
    return { report: DEMO_REPORT, sections: input.interpret ? generateDemoSections(DEMO_REPORT) : [], reportToken: null };
  }

  async interpret(report: NormalizedZwdsReport, _locale: Locale, options?: { signal?: AbortSignal }): Promise<ReportSection[]> {
    await delay(150, options?.signal);
    return generateDemoSections(report);
  }

  async getRulesetStatus(rulesetId: string, options?: { signal?: AbortSignal }) {
    await delay(120, options?.signal);
    if (rulesetId !== DEMO_REPORT.calculation.rulesetId) {
      throw new ProviderError('FUFIRE_UNKNOWN_RULESET', `Unknown ruleset ${rulesetId}`);
    }
    return {
      rulesetId,
      status: 'under_review',
      displayVersion: `Core Seed ${DEMO_REPORT.calculation.rulesetVersion}`,
    };
  }

  async createPdf(_reportToken: string, _locale: Locale, options?: { signal?: AbortSignal }): Promise<Blob> {
    await delay(200, options?.signal);
    throw new ProviderError('PDF_RUNTIME_UNAVAILABLE', 'Server-side PDF requires the BFF with a Chromium runtime.', true);
  }
}
