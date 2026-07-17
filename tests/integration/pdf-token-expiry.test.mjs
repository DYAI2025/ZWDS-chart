import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, loadConfig } from '../../server/index.mjs';
import { storeReport } from '../../server/reportStore.mjs';

// REQ-017 (T07): /api/report-pdf must validate the request — including the report
// token — BEFORE probing Chromium runtime availability. Otherwise the expired /
// unknown-token rejection (404 REPORT_TOKEN_UNKNOWN) is unreachable whenever
// Chromium is absent, because the `!PUPPETEER_EXECUTABLE_PATH -> 503` guard would
// short-circuit first. These tests prove the token check is reachable both with
// and without a configured runtime path, without ever launching real Chromium.
const MAX_AGE_MS = 30 * 60 * 1000;
const baseEnv = { FUFIRE_MODE: 'fixture', NODE_ENV: 'test', PORT: '0', RULESET_ID: 'zwds.fufire.core-seed.v1', LLM_ENABLED: 'false', LLM_CORPUS_STATUS: 'SOURCE_NEEDED' };

// Chromium absent — the real no-runtime deployment. The token check must still fire.
const noRuntimeApp = createApp(loadConfig({ ...baseEnv }));
// Chromium "present" via a dummy path — the 503 runtime branch cannot be what
// produces the response, so a 404 proves the token check itself ran.
const dummyRuntimeApp = createApp(loadConfig({ ...baseEnv, PUPPETEER_EXECUTABLE_PATH: '/nonexistent/chromium-for-tests' }));

const UNKNOWN_TOKEN = 'unknown-token-that-was-never-stored-in-the-report-store';

// Fake only Date so express/supertest real timers keep working while the
// 30-minute MAX_AGE_MS window is advanced deterministically.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'));
});
afterEach(() => vi.useRealTimers());

function expectTokenUnknown(response) {
  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('REPORT_TOKEN_UNKNOWN');
  // The response is the JSON error envelope, never a PDF payload.
  expect(response.headers['content-type']).toMatch(/application\/json/);
  expect(response.headers['content-disposition']).toBeUndefined();
  expect(response.body).not.toHaveProperty('report');
}

describe('PDF token expiry & unknown-token rejection (REQ-017, T07)', () => {
  it('rejects an unknown token with 404 when Chromium runtime is absent', async () => {
    const response = await request(noRuntimeApp).post('/api/report-pdf').send({ reportToken: UNKNOWN_TOKEN, locale: 'de-DE' });
    expectTokenUnknown(response);
  });

  it('rejects an expired token with 404 when Chromium runtime is absent', async () => {
    const token = storeReport({ calculation: { chartFingerprint: 'expired-no-runtime' } }, []);
    vi.advanceTimersByTime(MAX_AGE_MS + 1);
    const response = await request(noRuntimeApp).post('/api/report-pdf').send({ reportToken: token, locale: 'de-DE' });
    expectTokenUnknown(response);
  });

  it('rejects an unknown token with 404 even when a runtime path is configured', async () => {
    const response = await request(dummyRuntimeApp).post('/api/report-pdf').send({ reportToken: UNKNOWN_TOKEN, locale: 'de-DE' });
    expectTokenUnknown(response);
  });

  it('rejects an expired token with 404 even when a runtime path is configured (no PDF launched)', async () => {
    const token = storeReport({ calculation: { chartFingerprint: 'expired-dummy-runtime' } }, []);
    vi.advanceTimersByTime(MAX_AGE_MS + 1);
    const response = await request(dummyRuntimeApp).post('/api/report-pdf').send({ reportToken: token, locale: 'de-DE' });
    expectTokenUnknown(response);
  });
});
