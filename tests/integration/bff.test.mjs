import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp, loadConfig } from '../../server/index.mjs';

const config = loadConfig({ FUFIRE_MODE: 'fixture', NODE_ENV: 'test', PORT: '0', RULESET_ID: 'zwds.fufire.core-seed.v1', LLM_ENABLED: 'false', LLM_CORPUS_STATUS: 'SOURCE_NEEDED' });
const app = createApp(config);
const input = { date: '1984-02-01', time: '23:30', placeQuery: 'Shanghai', location: { lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', displayName: 'Shanghai, China', confirmed: true }, sexAtBirth: 'male', directionMethod: 'year_stem_yinyang_and_sex', locale: 'de-DE', scriptVariant: 'zh-Hant', includeDecadalLimits: true, interpret: true };

describe('BFF fixture integration', () => {
  it('allows PORT=0 only in test mode', () => {
    expect(config.PORT).toBe(0);
    expect(() => loadConfig({ NODE_ENV: 'production', PORT: '0' })).toThrow();
  });
  it('returns safe operational configuration', async () => {
    const response = await request(app).get('/api/config-status');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ dataMode: 'fixture', liveFufireVerified: false, llmConfigured: false });
    expect(JSON.stringify(response.body)).not.toMatch(/api.?key|secret/i);
  });
  it('geocodes through the isolated fixture provider', async () => {
    const response = await request(app).post('/api/geocode').send({ query: 'Shang', language: 'de' });
    expect(response.status).toBe(200);
    expect(response.body.results[0]).toMatchObject({ timezone: 'Asia/Shanghai', providerId: 'fixture-gazetteer', confidence: 1 });
  });
  it('returns the normalized golden chart and private PDF token', async () => {
    const response = await request(app).post('/api/zwds/calculate').send(input);
    expect(response.status).toBe(200);
    expect(response.body.report.palaces).toHaveLength(12);
    expect(response.body.report.stars.find((item) => item.placementId === 'natal:PO_JUN')).toMatchObject({ palaceId: 'TIAN_ZHAI', transformationTypes: ['HUA_QU'] });
    expect(response.body.reportToken.length).toBeGreaterThan(20);
    expect(response.body.sections.every((section) => section.truthClass && section.evidenceIds.length)).toBe(true);
  });
  it('rejects arbitrary fixture profiles without returning a report', async () => {
    const response = await request(app).post('/api/zwds/calculate').send({ ...input, date: '1990-01-01' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('FIXTURE_PROFILE_MISMATCH');
    expect(response.body.report).toBeUndefined();
  });
  it('checks ruleset metadata and rejects unknown rulesets', async () => {
    const ok = await request(app).get('/api/zwds/ruleset-status?rulesetId=zwds.fufire.core-seed.v1');
    expect(ok.status).toBe(200);
    expect(ok.body.crosscheckStatus).toBe('SOURCE_NEEDED');
    expect((await request(app).get('/api/zwds/ruleset-status?rulesetId=unknown')).status).toBe(404);
  });
  it('keeps LLM disabled and returns deterministic sections', async () => {
    const calculated = await request(app).post('/api/zwds/calculate').send(input);
    const response = await request(app).post('/api/zwds/interpret').send({ report: calculated.body.report, locale: 'de-DE' });
    expect(response.body).toMatchObject({ llmUsed: false, llmCorpusStatus: 'SOURCE_NEEDED' });
  });
  it('returns controlled PDF blocker without Chromium', async () => {
    // Corrected ordering (T07/REQ-017): the token is validated BEFORE the Chromium-runtime
    // probe, so the 503 PDF_RUNTIME_UNAVAILABLE blocker is only reached with a KNOWN token.
    // Previously this asserted 503 for an UNKNOWN token, which relied on the 503 guard running
    // first — the exact ordering bug that hid the expired/unknown-token 404. A real token from
    // /calculate now passes the token check and surfaces the genuine runtime blocker.
    const calculated = await request(app).post('/api/zwds/calculate').send(input);
    const response = await request(app).post('/api/report-pdf').send({ reportToken: calculated.body.reportToken, locale: 'de-DE' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('PDF_RUNTIME_UNAVAILABLE');
  });
});