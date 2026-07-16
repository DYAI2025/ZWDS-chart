import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateZwds, fetchRulesetMetadata, mapCalculateRequest, UpstreamError } from '../../server/fufireClient.mjs';

const config = { FUFIRE_BASE_URL: 'https://staging.invalid', FUFIRE_API_KEY: 'server-only-test-key', FUFIRE_AUTH_HEADER: 'x-api-key', FUFIRE_AUTH_SCHEME: undefined, FUFIRE_TIMEOUT_MS: 15000, RULESET_ID: 'zwds.fufire.core-seed.v1' };
const input = { date: '1984-02-01', time: '23:30', location: { lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai' }, sexAtBirth: 'male', directionMethod: 'year_stem_yinyang_and_sex', locale: 'de-DE', includeDecadalLimits: true };

afterEach(() => vi.unstubAllGlobals());

describe('FuFirE client boundary', () => {
  it('maps the browser DTO without leaking display-name PII', () => {
    const request = mapCalculateRequest(input, config.RULESET_ID);
    expect(request.birth.datetime_local).toBe('1984-02-01T23:30:00');
    expect(request.calculation.ruleset_id).toBe(config.RULESET_ID);
    expect(request.output).toMatchObject({ script_variant: 'ids_only', include_trace: true, include_catalog: false });
    expect(JSON.stringify(request)).not.toContain('displayName');
  });
  it('uses only the configured authentication header and metadata route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ruleset_id: config.RULESET_ID }) });
    vi.stubGlobal('fetch', fetchMock);
    await fetchRulesetMetadata(config.RULESET_ID, config);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/v1/metadata/zwds/rulesets/zwds.fufire.core-seed.v1');
    expect(init.headers['x-api-key']).toBe('server-only-test-key');
    expect(init.headers.authorization).toBeUndefined();
  });
  it('projects auth and rate-limit errors without upstream body leakage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ secret: 'do-not-leak' }) }));
    await expect(calculateZwds(input, config)).rejects.toMatchObject({ code: 'FUFIRE_AUTH_FAILED', status: 502 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }));
    await expect(calculateZwds(input, config)).rejects.toMatchObject({ code: 'FUFIRE_RATE_LIMITED', retryable: true });
  });
  it('uses a typed upstream error', () => {
    expect(new UpstreamError('X','message',503,true)).toMatchObject({ code: 'X', retryable: true });
  });
});