import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// AMD-003 real-boundary smoke for the optional geocode boundary. Consumes the pinned REAL
// geocode responses created by `node --env-file=.env scripts/amd003-pin.mjs` (only when
// FUFIRE_GEOCODE_PATH was configured) — one geocode-<slug>.json per profile. Until any pin
// exists, the suite stays green via a clearly-labelled skip — no network, no fabricated evidence.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PINNED_DIR = path.resolve(__dirname, '../fixtures/fufire/pinned-real');
const pins = fs.existsSync(PINNED_DIR)
  ? fs.readdirSync(PINNED_DIR).filter((name) => /^geocode-.+\.json$/.test(name)).sort()
  : [];

// Geocode result contract — kept-in-sync MIRROR of server/geocodeProviders.mjs
// (geocodeResultSchema + `.max(5)`). Duplicated here so the test does not import a
// non-exported symbol and server/ stays untouched.
const geocodeResultSchema = z.object({
  displayName: z.string().min(1).max(160),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().min(1).max(80),
  providerId: z.string().min(1).max(80),
  confidence: z.number().min(0).max(1).nullable(),
}).strict();
const GEO_CONTRACT = z.array(geocodeResultSchema).max(5);
const IANA = /^[A-Za-z]+\/[A-Za-z0-9_+-]+/;

const readPin = (name) => JSON.parse(fs.readFileSync(path.join(PINNED_DIR, name), 'utf8'));

describe('AMD-003 real FuFirE geocode boundary smoke (n>=2 profiles)', () => {
  if (pins.length === 0) {
    it.skip('awaits the AMD-003 pins — run `node --env-file=.env scripts/amd003-pin.mjs` with FUFIRE_GEOCODE_PATH set to create tests/fixtures/fufire/pinned-real/geocode-*.json', () => {});
    return;
  }

  it.each(pins)('pinned real geocode response %s conforms to the geocode result contract', (name) => {
    const results = readPin(name);
    expect(GEO_CONTRACT.safeParse(results).success, `${name} must satisfy the geocode contract`).toBe(true);
    expect(results.length, `${name} must have at least one real result`).toBeGreaterThan(0);
    // Every result carries a resolvable IANA timezone — the field the birth calc depends on.
    for (const result of results) expect(result.timezone, `${name}/${result.displayName} timezone`).toMatch(IANA);
  });

  it('pins at least two distinct real profiles, covering both a single-match and a multi-candidate response', () => {
    expect(pins.length, 'need n>=2 pinned geocode profiles').toBeGreaterThanOrEqual(2);
    const sizes = pins.map((name) => readPin(name).length);
    // Distinct parser branches: an unambiguous single match (200) AND an ambiguous set (422).
    expect(sizes.some((n) => n === 1), 'expected at least one single-match profile (200 path)').toBe(true);
    expect(sizes.some((n) => n > 1), 'expected at least one multi-candidate profile (422 path)').toBe(true);
  });
});
