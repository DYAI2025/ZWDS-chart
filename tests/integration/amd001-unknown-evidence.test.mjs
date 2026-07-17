import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp, loadConfig } from '../../server/index.mjs';
import { normalizeRaw } from '../../server/normalize.mjs';

// AMD-001 / REQ-019: unknown / unsupported / unresolved evidence must HARD fail-closed.
// The BFF must never emit a partial report with a SECTION_EVIDENCE_REJECTED soft-drop warning.

const config = loadConfig({ FUFIRE_MODE: 'fixture', NODE_ENV: 'test', PORT: '0', RULESET_ID: 'zwds.fufire.core-seed.v1', LLM_ENABLED: 'false', LLM_CORPUS_STATUS: 'SOURCE_NEEDED' });
const app = createApp(config);

const fixture = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json'), 'utf8'));
const goldenReport = () => normalizeRaw(fixture, 'fixture');

const calculateInput = {
  date: '1984-02-01',
  time: '23:30',
  placeQuery: 'Shanghai',
  location: { lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', displayName: 'Shanghai, China', confirmed: true },
  sexAtBirth: 'male',
  directionMethod: 'year_stem_yinyang_and_sex',
  locale: 'de-DE',
  scriptVariant: 'zh-Hant',
  includeDecadalLimits: true,
  interpret: true,
};

describe('AMD-001 unknown evidence fail-closed (REQ-019)', () => {
  it('hard-refuses /interpret when a referenced evidence-index entry is missing', async () => {
    const report = goldenReport();
    // Remove exactly one evidence entry that a generated section references.
    const mutated = { ...report, evidenceIndex: report.evidenceIndex.filter((entry) => entry.evidenceId !== 'anchor.ming') };
    expect(mutated.evidenceIndex.length).toBe(report.evidenceIndex.length - 1);

    const response = await request(app).post('/api/zwds/interpret').send({ report: mutated, locale: 'de-DE' });

    expect(response.status).not.toBe(200);
    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('EVIDENCE_UNRESOLVED');
    expect(typeof response.body.error.requestId).toBe('string');
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
    expect(response.body.sections).toBeUndefined();
    expect(response.body.report).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('SECTION_EVIDENCE_REJECTED');
  });

  it('NEGATIVE CONTROL: intact golden report still interprets with sections (no over-refusal)', async () => {
    const report = goldenReport();
    const response = await request(app).post('/api/zwds/interpret').send({ report, locale: 'de-DE' });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.sections)).toBe(true);
    expect(response.body.sections.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body)).not.toContain('SECTION_EVIDENCE_REJECTED');
  });

  it('a structurally malformed report yields 400, not a 500 from a field deref', async () => {
    // Passes the evidenceIndex-is-array check but is missing calculation/palaces/stars/quality.
    const response = await request(app).post('/api/zwds/interpret').send({ report: { evidenceIndex: [] }, locale: 'de-DE' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.sections).toBeUndefined();
  });

  it('NEGATIVE CONTROL: intact /calculate still returns a report and reportToken', async () => {
    const response = await request(app).post('/api/zwds/calculate').send(calculateInput);
    expect(response.status).toBe(200);
    expect(response.body.report).toBeDefined();
    expect(typeof response.body.reportToken).toBe('string');
    expect(response.body.reportToken.length).toBeGreaterThan(20);
  });
});
