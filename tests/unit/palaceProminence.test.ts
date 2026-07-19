import { describe, it, expect } from 'vitest';
import { DEMO_REPORT } from '@/data/mockZwdsReport';
import {
  computePalaceProminence,
  MAX_PROMINENT_PALACES,
  PALACE_PROMINENCE_RULE_ID,
} from '@/domain/palaceProminence';
import type {
  NormalizedZwdsReport, NormalizedPalace, NormalizedStarPlacement, NormalizedRelation, PalaceId,
} from '@/domain/zwdsTypes';

// Build a minimal-but-valid report by overriding only the fields the rule reads and
// regenerating a matching evidenceIndex (so evidence ids resolve, unless a test drops them).
function makeReport(over: {
  palaces: NormalizedPalace[];
  stars: NormalizedStarPlacement[];
  relations?: NormalizedRelation[];
}): NormalizedZwdsReport {
  const relations = over.relations ?? [];
  const evidenceIndex = [
    { evidenceId: 'anchor.ming', type: 'anchor', value: {}, sourceStatus: 'SOURCE_NEEDED' as const },
    ...over.palaces.map((p) => ({ evidenceId: `palace.${p.palaceId}`, type: 'palace', value: p, sourceStatus: 'SOURCE_NEEDED' as const })),
    ...over.stars.map((s) => ({ evidenceId: `placement.${s.placementId}`, type: 'placement', value: s, sourceStatus: 'SOURCE_NEEDED' as const })),
    ...over.stars.flatMap((s) => s.transformationTypes.map((t) => ({ evidenceId: `transformation.${t}`, type: 'transformation', value: t, sourceStatus: 'SOURCE_NEEDED' as const }))),
    ...relations.map((r) => ({ evidenceId: r.relationId, type: 'relation', value: r, sourceStatus: 'SOURCE_NEEDED' as const })),
  ];
  return { ...DEMO_REPORT, palaces: over.palaces, stars: over.stars, relations, evidenceIndex };
}

const palace = (palaceId: PalaceId, placementIds: string[], isMing = false): NormalizedPalace => ({
  palaceId, branchId: 'ZI', stemId: 'JIA', placementIds, isMing, isShen: false,
});
const majorStar = (placementId: string, starId: NormalizedStarPlacement['starId'], palaceId: PalaceId): NormalizedStarPlacement => ({
  placementId, starId, palaceId, branchId: 'ZI', transformationTypes: [], sourceStatus: 'SOURCE_NEEDED', provenanceIds: [],
});

describe('PALACE_PROMINENCE_PRODUCT_RULE_V1', () => {
  it('selects at most three prominent palaces from the demo report and names Ming as the personal core', () => {
    const model = computePalaceProminence(DEMO_REPORT);
    expect(model.ruleId).toBe(PALACE_PROMINENCE_RULE_ID);
    expect(model.prominentPalaces.length).toBeLessThanOrEqual(MAX_PROMINENT_PALACES);
    expect(model.prominentPalaces.length).toBeGreaterThan(0);
    expect(model.personalCore?.palaceId).toBe('MING');
    // The Ming palace is the personal core and never consumes a prominence slot.
    expect(model.prominentPalaces.map((p) => p.palaceId)).not.toContain('MING');
  });

  it('every selection is a PRODUCT_TRANSLATION bound to at least one resolvable evidence id', () => {
    const model = computePalaceProminence(DEMO_REPORT);
    const validEvidence = new Set(DEMO_REPORT.evidenceIndex.map((e) => e.evidenceId));
    for (const p of model.prominentPalaces) {
      expect(p.truthClass).toBe('PRODUCT_TRANSLATION');
      expect(p.evidenceIds.length).toBeGreaterThan(0);
      for (const id of p.evidenceIds) expect(validEvidence.has(id)).toBe(true);
      expect(p.signals.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic — identical input yields identical output (fixture == bff parity)', () => {
    expect(computePalaceProminence(DEMO_REPORT)).toEqual(computePalaceProminence(DEMO_REPORT));
  });

  it('orders by product signal priority: two major stars outrank one major star', () => {
    const report = makeReport({
      palaces: [
        palace('MING', [], true),
        palace('CAI_BO', ['p1', 'p2']),   // 2 major → higher
        palace('GUAN_LU', ['p3']),        // 1 major → lower
      ],
      stars: [
        majorStar('p1', 'ZI_WEI', 'CAI_BO'),
        majorStar('p2', 'TIAN_JI', 'CAI_BO'),
        majorStar('p3', 'TAI_YANG', 'GUAN_LU'),
      ],
    });
    const model = computePalaceProminence(report);
    expect(model.prominentPalaces.map((p) => p.palaceId)).toEqual(['CAI_BO', 'GUAN_LU']);
  });

  it('does not fabricate a rank for equal palaces: a boundary tie is dropped, showing fewer', () => {
    // Two palaces at 2 major stars (fit), then three palaces at 1 major star (would overflow).
    const report = makeReport({
      palaces: [
        palace('MING', [], true),
        palace('CAI_BO', ['a1', 'a2']),
        palace('GUAN_LU', ['b1', 'b2']),
        palace('FU_DE', ['c1']),
        palace('JIAO_YOU', ['d1']),
        palace('ZI_NU', ['e1']),
      ],
      stars: [
        majorStar('a1', 'ZI_WEI', 'CAI_BO'), majorStar('a2', 'TIAN_JI', 'CAI_BO'),
        majorStar('b1', 'TAI_YANG', 'GUAN_LU'), majorStar('b2', 'WU_QU', 'GUAN_LU'),
        majorStar('c1', 'TIAN_TONG', 'FU_DE'),
        majorStar('d1', 'LIAN_ZHEN', 'JIAO_YOU'),
        majorStar('e1', 'TIAN_FU', 'ZI_NU'),
      ],
    });
    const model = computePalaceProminence(report);
    // The 1-star tie group of three would push count over three, so it is dropped whole.
    expect(model.prominentPalaces.map((p) => p.palaceId).sort()).toEqual(['CAI_BO', 'GUAN_LU']);
    expect(model.equalGroupTruncated).toBe(false);
    expect(model.prominentPalaces.every((p) => !p.tiedWithNext || model.prominentPalaces.filter((q) => q.score === p.score).length > 1)).toBe(true);
  });

  it('truncates a first-group tie transparently rather than picking arbitrarily', () => {
    // Four palaces all with exactly one major star → all equal, first group size 4 > cap.
    const report = makeReport({
      palaces: [
        palace('MING', [], true),
        palace('FU_QI', ['w1']), palace('CAI_BO', ['x1']),
        palace('GUAN_LU', ['y1']), palace('JIAO_YOU', ['z1']),
      ],
      stars: [
        majorStar('w1', 'ZI_WEI', 'FU_QI'), majorStar('x1', 'TIAN_JI', 'CAI_BO'),
        majorStar('y1', 'TAI_YANG', 'GUAN_LU'), majorStar('z1', 'WU_QU', 'JIAO_YOU'),
      ],
    });
    const model = computePalaceProminence(report);
    expect(model.prominentPalaces.length).toBe(MAX_PROMINENT_PALACES);
    expect(model.equalGroupTruncated).toBe(true);
    // All selected share the same score → the UI must present them as equivalent.
    const scores = new Set(model.prominentPalaces.map((p) => p.score));
    expect(scores.size).toBe(1);
  });

  it('fail-closed: a palace whose evidence ids are absent from the index is dropped', () => {
    const model = computePalaceProminence({ ...DEMO_REPORT, evidenceIndex: [] });
    expect(model.prominentPalaces).toHaveLength(0);
    expect(model.personalCore?.evidenceIds).toHaveLength(0);
  });
});
