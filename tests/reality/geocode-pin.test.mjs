import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// AMD-003 real-boundary smoke for the optional geocode boundary. Consumes the pinned REAL
// geocode response created by `node --env-file=.env scripts/amd003-pin.mjs` (only when
// FUFIRE_GEOCODE_PATH was configured). Until that pin exists, the suite stays green via a
// clearly-labelled skip — no network, no fabricated evidence.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEO_PIN = path.resolve(__dirname, '../fixtures/fufire/pinned-real/geocode.json');
const pinned = fs.existsSync(GEO_PIN);

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

describe('AMD-003 real FuFirE geocode boundary smoke', () => {
  if (!pinned) {
    it.skip('awaits the AMD-003 pin — run `node --env-file=.env scripts/amd003-pin.mjs` with FUFIRE_GEOCODE_PATH set to create tests/fixtures/fufire/pinned-real/geocode.json', () => {});
    return;
  }

  it('the pinned real geocode response conforms to the geocode result contract', () => {
    const results = JSON.parse(fs.readFileSync(GEO_PIN, 'utf8'));
    const parsed = GEO_CONTRACT.safeParse(results);
    expect(parsed.success).toBe(true);
  });
});
