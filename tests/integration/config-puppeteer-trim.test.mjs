import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../server/index.mjs';

// Deploy-verify finding (2026-07-18): the Railway PUPPETEER_EXECUTABLE_PATH was stored as
// "/usr/bin/chromium  " (trailing spaces). Puppeteer then looked for a path that does not
// exist and every POST /api/report-pdf failed with an opaque 503 PDF_RENDER_FAILED even
// though Chromium was present. envSchema now trims the value so stray whitespace in the
// stored config can never break PDF render again.
const baseEnv = {
  FUFIRE_MODE: 'fixture',
  NODE_ENV: 'test',
  PORT: '0',
  RULESET_ID: 'zwds.fufire.core-seed.v1',
  LLM_ENABLED: 'false',
  LLM_CORPUS_STATUS: 'SOURCE_NEEDED',
};

describe('PUPPETEER_EXECUTABLE_PATH whitespace normalization (deploy-config robustness)', () => {
  it('trims a trailing-space value so Puppeteer receives a valid path', () => {
    const config = loadConfig({ ...baseEnv, PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium  ' });
    expect(config.PUPPETEER_EXECUTABLE_PATH).toBe('/usr/bin/chromium');
  });

  it('trims leading whitespace too', () => {
    const config = loadConfig({ ...baseEnv, PUPPETEER_EXECUTABLE_PATH: '  /usr/bin/chromium' });
    expect(config.PUPPETEER_EXECUTABLE_PATH).toBe('/usr/bin/chromium');
  });

  it('stays undefined when unset', () => {
    expect(loadConfig({ ...baseEnv }).PUPPETEER_EXECUTABLE_PATH).toBeUndefined();
  });
});
