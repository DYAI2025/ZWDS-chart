import { describe, it, expect, vi, afterEach } from 'vitest';
import { FufireGeocodeProvider } from '../../server/geocodeProviders.mjs';

// Live FuFirE geocode contract (verified against api.fufire.space, 2026-07-17).
// These are PINNED sample responses — no live call is made; global fetch is stubbed.
const config = {
  FUFIRE_BASE_URL: 'https://api.fufire.space',
  FUFIRE_GEOCODE_PATH: '/v1/geocode',
  FUFIRE_API_KEY: 'server-only-test-key',
  FUFIRE_AUTH_HEADER: 'x-api-key',
  FUFIRE_AUTH_SCHEME: undefined,
  FUFIRE_TIMEOUT_MS: 15000,
};

// Pinned unambiguous 200 response.
const BERLIN_200 = { lat: 52.52, lon: 13.41, resolved_name: 'Berlin', confidence: 0.997, timezone: 'Europe/Berlin', country_code: 'DE' };
// Pinned ambiguous 422 response — candidates carry lat/lon but NO timezone and NO confidence.
const SHANGHAI_422 = {
  error: 'ambiguous_place',
  candidates: [
    { name: 'Shanghai', lat: 31.22, lon: 121.45, country_code: 'CN', population: 24874500 },
    { name: 'Shanghai', lat: 34.85, lon: -87.08, country_code: 'US', population: 4845 },
  ],
};
// Pinned place-not-found response for a garbage query.
const NOT_FOUND_404 = { error: 'place_not_found' };

const stubFetch = (status, body) => {
  const fetchMock = vi.fn().mockResolvedValue({ status, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe('FufireGeocodeProvider against the real FuFirE geocode contract', () => {
  it('(a) resolves an unambiguous 200 match to one schema-valid result with the upstream timezone', async () => {
    const fetchMock = stubFetch(200, BERLIN_200);
    const results = await new FufireGeocodeProvider(config).search('Berlin', 'de');

    // Request body must be EXACTLY { place } — sending query/language/limit would 422 the real API.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.fufire.space/v1/geocode');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ place: 'Berlin' });
    expect(init.headers['x-api-key']).toBe('server-only-test-key');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      displayName: 'Berlin, DE',
      lat: 52.52,
      lon: 13.41,
      timezone: 'Europe/Berlin',
      providerId: 'fufire',
      confidence: 0.997,
    });
  });

  it('(b) maps an ambiguous 422 body to multiple results, deriving each timezone from lat/lon with null confidence', async () => {
    stubFetch(422, SHANGHAI_422);
    const results = await new FufireGeocodeProvider(config).search('Shanghai', 'en');

    expect(results.length).toBeGreaterThan(1);
    expect(results[0]).toMatchObject({ displayName: 'Shanghai, CN', timezone: 'Asia/Shanghai', providerId: 'fufire', confidence: null });
    // Every candidate result carries a non-empty timezone derived offline from its coordinates.
    for (const result of results) {
      expect(typeof result.timezone).toBe('string');
      expect(result.timezone.length).toBeGreaterThan(0);
      expect(result.confidence).toBeNull();
    }
    // The Alabama "Shanghai" resolves to a US zone, proving the timezone came from lat/lon, not a constant.
    expect(results[1].timezone).toBe('America/Chicago');
  });

  it('(c) returns [] for a garbage/unknown place (place-not-found, nothing to resolve)', async () => {
    stubFetch(404, NOT_FOUND_404);
    const results = await new FufireGeocodeProvider(config).search('zzxqwvunknownplace', 'en');
    expect(results).toEqual([]);
  });
});
