import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  canonicalCatalogueString,
  CATALOG_CONTENT_SHA256,
  CATALOG_SHA256,
  catalogueStatusFor,
  catalogueGovernanceStatus,
  FULL_CATALOGUE,
} from '@/data/zwdsCatalog';

// Catalogue-digest governance. The catalogue's content digest is pinned as a drift guard, and
// its authoritative status is gated on a reviewed digest that must exactly match that content.
// No reviewed digest is fabricated: CATALOG_SHA256 stays null until a named reviewer signs off,
// so the catalogue is SOURCE_NEEDED by default.
const computed = crypto.createHash('sha256').update(canonicalCatalogueString()).digest('hex');

describe('catalogue content digest + source-governance', () => {
  it('serializes every catalogue entry into the canonical digest input', () => {
    expect(FULL_CATALOGUE.length).toBeGreaterThan(40);
    // Stable ordering: serializing twice is byte-identical.
    expect(canonicalCatalogueString()).toBe(canonicalCatalogueString());
  });

  it('the pinned content digest matches the current catalogue (drift guard)', () => {
    expect(CATALOG_CONTENT_SHA256).toBe(computed);
  });

  it('is SOURCE_NEEDED by default — no reviewed digest is pinned (never fabricated)', () => {
    expect(CATALOG_SHA256).toBeNull();
    expect(catalogueGovernanceStatus()).toBe('SOURCE_NEEDED');
  });

  it('a reviewed pin equal to the content digest elevates to SOURCE_REVIEWED', () => {
    expect(catalogueStatusFor(CATALOG_CONTENT_SHA256)).toBe('SOURCE_REVIEWED');
  });

  it('a drifted / mismatched / absent reviewed pin does NOT elevate (fail-closed)', () => {
    expect(catalogueStatusFor('f'.repeat(64))).toBe('SOURCE_NEEDED');
    expect(catalogueStatusFor(null)).toBe('SOURCE_NEEDED');
  });
});
