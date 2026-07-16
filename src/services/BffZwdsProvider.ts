import type {
  ZwdsDataProvider, NormalizedZwdsReport, ZwdsBirthInput, ReportSection, Locale, ZwdsCalculationResult, GeocodeResult,
} from '@/domain/zwdsTypes';
import { ProviderError } from './MockZwdsProvider';

// ── BFF provider ───────────────────────────────────────────
// The browser talks ONLY to our own Express BFF.
// FuFirE response formats stay server-side.

const DEFAULT_BASE = '/api';

function base(): string {
  return import.meta.env.VITE_BFF_BASE_URL || DEFAULT_BASE;
}

async function request<T>(path: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base()}${path}`, { ...init, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ProviderError('BFF_UNAVAILABLE', 'The backend service is not available.', true);
  }

  if (!response.ok) {
    let envelope: { error?: { code?: string; message?: string; retryable?: boolean } } = {};
    try { envelope = await response.json(); } catch { /* ignore */ }
    throw new ProviderError(
      envelope.error?.code ?? 'BFF_HTTP_ERROR',
      envelope.error?.message ?? `Backend returned ${response.status}`,
      envelope.error?.retryable ?? response.status >= 500
    );
  }
  return (await response.json()) as T;
}

function birthInputToDto(input: ZwdsBirthInput) {
  if (!input.location) throw new ProviderError('VALIDATION_FAILED', 'A confirmed location with timezone is required.');
  return {
    date: input.date,
    time: input.time,
    placeQuery: input.placeQuery,
    location: input.location,
    sexAtBirth: input.sexAtBirth,
    directionMethod: input.directionMethod,
    flowDirection: input.flowDirection,
    locale: input.locale,
    scriptVariant: input.scriptVariant,
    includeDecadalLimits: input.includeDecadalLimits,
    interpret: input.interpret,
  };
}

export class BffZwdsProvider implements ZwdsDataProvider {
  async geocode(query: string, language: 'de' | 'en', options?: { signal?: AbortSignal }): Promise<GeocodeResult[]> {
    const result = await request<{ results: GeocodeResult[] }>(
      '/geocode',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, language }) },
      options?.signal
    );
    return result.results;
  }

  readonly mode = 'bff' as const;

  async calculate(input: ZwdsBirthInput, options?: { signal?: AbortSignal }): Promise<ZwdsCalculationResult> {
    const dto = birthInputToDto(input);
    const result = await request<ZwdsCalculationResult>(
      '/zwds/calculate',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) },
      options?.signal
    );
    if (!result.report || result.report.schemaVersion !== 'fufire.zwds-evidence.v1') {
      throw new ProviderError('FUFIRE_CONTRACT_MISMATCH', 'The backend returned an unsupported report bundle.');
    }
    return result;
  }

  async interpret(report: NormalizedZwdsReport, locale: Locale, options?: { signal?: AbortSignal }): Promise<ReportSection[]> {
    const result = await request<{ sections: ReportSection[] }>(
      '/zwds/interpret',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ report, locale }) },
      options?.signal
    );
    return result.sections;
  }

  async getRulesetStatus(rulesetId: string, options?: { signal?: AbortSignal }) {
    return request<{ rulesetId: string; status: string; displayVersion: string }>(
      `/zwds/ruleset-status?rulesetId=${encodeURIComponent(rulesetId)}`,
      { method: 'GET' },
      options?.signal
    );
  }

  async createPdf(reportToken: string, locale: Locale, options?: { signal?: AbortSignal }): Promise<Blob> {
    const response = await fetch(`${base()}/report-pdf`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reportToken, locale }),
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new ProviderError('PDF_RUNTIME_UNAVAILABLE', 'Server-side PDF is not available in this environment.', true);
    }
    return response.blob();
  }
}
