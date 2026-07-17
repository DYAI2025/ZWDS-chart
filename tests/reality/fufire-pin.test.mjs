import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRawZwds, assertInvariants, normalizeRaw } from '../../server/normalize.mjs';

// AMD-003 real-boundary smoke. Consumes the pinned REAL /calculate response created by
// `node --env-file=.env scripts/amd003-pin.mjs`. Until that pin exists, the suite stays green
// via a clearly-labelled skip — it never fabricates evidence and never calls the network.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CALC_PIN = path.resolve(__dirname, '../fixtures/fufire/pinned-real/calculate.json');
const pinned = fs.existsSync(CALC_PIN);

describe('AMD-003 real FuFirE /calculate boundary smoke', () => {
  if (!pinned) {
    it.skip('awaits the AMD-003 pin — run `node --env-file=.env scripts/amd003-pin.mjs` with live staging credentials to create tests/fixtures/fufire/pinned-real/calculate.json', () => {});
    return;
  }

  it('the pinned real /calculate response conforms to parseRawZwds + assertInvariants', () => {
    const raw = JSON.parse(fs.readFileSync(CALC_PIN, 'utf8'));
    const parsed = parseRawZwds(raw);
    expect(() => assertInvariants(parsed)).not.toThrow();
  });

  it('the pinned real /calculate response normalizes to a 12-palace evidence report', () => {
    const raw = JSON.parse(fs.readFileSync(CALC_PIN, 'utf8'));
    const report = normalizeRaw(raw, 'live');
    expect(report.schemaVersion).toBe('fufire.zwds-evidence.v1');
    expect(report.palaces).toHaveLength(12);
    expect(report.calculation.dataMode).toBe('live');
  });
});
