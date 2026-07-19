import { describe, it, expect } from 'vitest';
import { DEMO_REPORT } from '@/data/mockZwdsReport';
import { buildGuidedRelations } from '@/domain/palaceRelations';

describe('Iteration 2 — guided relations (no invention, fail-closed)', () => {
  it('reads harmony and opposition for Ming straight from calculated relations', () => {
    const model = buildGuidedRelations(DEMO_REPORT, 'MING');
    expect(model.truthClass).toBe('CALCULATED_FACT');
    expect(model.hasAny).toBe(true);
    expect(model.harmony.map((edge) => edge.palaceId).sort()).toEqual(['CAI_BO', 'GUAN_LU']);
    expect(model.opposition?.palaceId).toBe('QIAN_YI');
    // Every edge is backed by a resolvable calculated relationId.
    const valid = new Set(DEMO_REPORT.evidenceIndex.map((e) => e.evidenceId));
    for (const edge of [...model.harmony, ...(model.opposition ? [model.opposition] : [])]) {
      expect(edge.evidenceIds.every((id) => valid.has(id))).toBe(true);
    }
  });

  it('never invents a connection: a palace with no calculated relation returns an empty model', () => {
    // Remove every relation touching FU_MU — the rule must not fabricate one to fill the gap.
    const relations = DEMO_REPORT.relations.filter((relation) => !relation.palaceIds.includes('FU_MU'));
    const model = buildGuidedRelations({ ...DEMO_REPORT, relations }, 'FU_MU');
    expect(model.hasAny).toBe(false);
    expect(model.harmony).toHaveLength(0);
    expect(model.opposition).toBeNull();
  });

  it('fail-closed: relations whose evidence id is absent from the index are dropped', () => {
    const model = buildGuidedRelations({ ...DEMO_REPORT, evidenceIndex: [] }, 'MING');
    expect(model.hasAny).toBe(false);
  });
});
