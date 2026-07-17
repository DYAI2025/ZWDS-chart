import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeRaw, generateSections, ContractError, assertRulesetMetadata } from '../../server/normalize.mjs';

const fixture = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json'), 'utf8'));
const metadata = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/fufire/ruleset-core-seed.json'), 'utf8'));

describe('canonical FuFirE golden fixture', () => {
  it('uses canonical placement truth and required anchors', () => {
    expect(fixture.schema_version).toBe('zwds.raw.v1');
    expect(fixture.ruleset.ruleset_id).toBe('zwds.fufire.core-seed.v1');
    expect(fixture.chart.ming_palace_branch_id).toBe('YIN');
    expect(fixture.chart.shen_palace_branch_id).toBe('YIN');
    expect(fixture.chart.five_elements_bureau).toMatchObject({ id: 'FIRE_6', number: 6 });
    expect(fixture.resolution.chronometry.late_zi_applied).toBe(true);
    expect(fixture.chart.palaces).toHaveLength(12);
    expect(fixture.chart.decadal_limits).toHaveLength(12);
    const palaces = new Map(fixture.chart.palaces.map((palace) => [palace.palace_role_id, palace]));
    expect(palaces.get('MING').placement_ids).toEqual([]);
    expect(palaces.get('FU_MU').placement_ids).toEqual([]);
  });

  it('binds transformations to concrete original placement ids', () => {
    const placements = new Map(fixture.chart.star_placements.map((placement) => [placement.placement_id, placement]));
    expect(placements.get('natal:TAI_YANG')).toMatchObject({ palace_role_id: 'GUAN_LU', transformation_types: ['HUA_JI'] });
    expect(placements.get('natal:WU_QU')).toMatchObject({ palace_role_id: 'TIAN_ZHAI', transformation_types: ['HUA_KE'] });
    expect(placements.get('natal:PO_JUN')).toMatchObject({ palace_role_id: 'TIAN_ZHAI', transformation_types: ['HUA_QUAN'] });
    expect(placements.get('natal:LIAN_ZHEN')).toMatchObject({ palace_role_id: 'XIONG_DI', transformation_types: ['HUA_LU'] });
  });

  it('normalizes ids, provenance, warnings and trace losslessly', () => {
    const report = normalizeRaw(fixture);
    expect(report.stars.map((placement) => placement.placementId)).toEqual(fixture.chart.star_placements.map((placement) => placement.placement_id));
    expect(report.transformations.find((item) => item.transformationId === 'HUA_QUAN')).toMatchObject({ placementId: 'natal:PO_JUN', starId: 'PO_JUN', palaceId: 'TIAN_ZHAI' });
    expect(report.provenance[0].recordId).toBe(fixture.provenance[0].provenance_id);
    // The real response emits no quality warnings (its warnings[] is empty).
    expect(report.quality.warnings).toEqual([]);
    // Real derivation_trace carries computed steps (no longer the fabricated empty []).
    expect(report.derivationTrace).toEqual(fixture.derivation_trace);
    expect(report.derivationTrace.length).toBeGreaterThan(0);
    expect(report.evidenceIndex.some((entry) => entry.evidenceId === 'placement.natal:TAI_YANG')).toBe(true);
  });

  it('rejects manipulated references, coordinates and transformation duplicates', () => {
    const missing = structuredClone(fixture);
    missing.chart.palaces[0].placement_ids[0] = 'natal:UNKNOWN';
    expect(() => normalizeRaw(missing)).toThrow(ContractError);
    const mismatch = structuredClone(fixture);
    mismatch.chart.star_placements[0].branch_id = 'WU';
    expect(() => normalizeRaw(mismatch)).toThrow(ContractError);
    const duplicate = structuredClone(fixture);
    duplicate.chart.star_placements[3].transformation_types = ['HUA_JI'];
    expect(() => normalizeRaw(duplicate)).toThrow(ContractError);
  });

  it('crosschecks every available ruleset metadata field', () => {
    expect(assertRulesetMetadata(fixture.ruleset, metadata).ruleset_id).toBe('zwds.fufire.core-seed.v1');
    expect(() => assertRulesetMetadata(fixture.ruleset, { ...metadata, ruleset_version: '9.9.9' })).toThrowError(/mismatch/i);
  });

  it('generates only evidence-bound deterministic sections', () => {
    const report = normalizeRaw(fixture);
    const result = generateSections(report);
    const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
    expect(result.sections.length).toBeGreaterThan(0);
    for (const section of result.sections) {
      expect(section.ruleVersion).toBe('1.0.0');
      expect(section.evidenceIds.length).toBeGreaterThan(0);
      expect(section.evidenceIds.every((id) => valid.has(id))).toBe(true);
    }
  });
});