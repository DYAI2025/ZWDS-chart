import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeRaw } from '../../server/normalize.mjs';
import { computePalaceProminence } from '@/domain/palaceProminence';
import { buildGuidedRelations } from '@/domain/palaceRelations';
import { buildLifePhase } from '@/domain/lifePhase';
import { buildReflection, REFLECTION_THEMES } from '@/domain/reflection';
import { DEMO_REPORT } from '@/data/mockZwdsReport';

// REQ-F-900: the Guided views are pure product-translation layers over the SAME calculated
// report. Every other guided test seeds the hand-authored DEMO_REPORT (fixture-mode). This
// one runs the identical rules against the SERVER-normalized report (the bff path,
// server/normalize.mjs → buildEvidenceIndex) so a divergent evidence-id shape in the
// normalizer would fail HERE instead of silently emptying the guided views in production.
const raw = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json'), 'utf8'));
const report = normalizeRaw(raw, 'fixture');

describe('Guided views run on the real server-normalized report (bff parity)', () => {
  it('prominence resolves evidence-bound palaces against the normalized evidenceIndex (not empty)', () => {
    const model = computePalaceProminence(report);
    expect(model.prominentPalaces.length).toBeGreaterThan(0);
    expect(model.prominentPalaces.length).toBeLessThanOrEqual(3);
    expect(model.personalCore?.palaceId).toBe('MING');
    const valid = new Set(report.evidenceIndex.map((e) => e.evidenceId));
    for (const palace of model.prominentPalaces) {
      expect(palace.evidenceIds.length).toBeGreaterThan(0);
      for (const id of palace.evidenceIds) expect(valid.has(id), id).toBe(true);
    }
  });

  it('produces the SAME prominent-palace set as fixture-mode (fixture == bff)', () => {
    const bff = computePalaceProminence(report).prominentPalaces.map((p) => p.palaceId).sort();
    const fixture = computePalaceProminence(DEMO_REPORT).prominentPalaces.map((p) => p.palaceId).sort();
    expect(bff).toEqual(fixture);
  });

  it('relations for the personal core are non-empty and evidence-resolvable', () => {
    const relations = buildGuidedRelations(report, 'MING');
    expect(relations.hasAny).toBe(true);
    const valid = new Set(report.evidenceIndex.map((e) => e.evidenceId));
    for (const edge of [...relations.harmony, ...(relations.opposition ? [relations.opposition] : [])]) {
      for (const id of edge.evidenceIds) expect(valid.has(id), id).toBe(true);
    }
  });

  it('life phase resolves a calculated decade for a mid-life age', () => {
    expect(buildLifePhase(report, 42).status).toBe('RESOLVED');
  });

  it('every reflection theme stays chart-bound against the normalized report', () => {
    for (const theme of REFLECTION_THEMES) {
      const answer = buildReflection(report, theme);
      const bound = answer.evidenceIds.length > 0 || answer.chartReferences.palaceId != null;
      expect(bound, theme).toBe(true);
    }
  });
});
