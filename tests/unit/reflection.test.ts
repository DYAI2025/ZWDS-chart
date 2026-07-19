import { describe, it, expect } from 'vitest';
import { DEMO_REPORT } from '@/data/mockZwdsReport';
import { buildReflection, REFLECTION_THEMES } from '@/domain/reflection';

const validEvidence = new Set(DEMO_REPORT.evidenceIndex.map((e) => e.evidenceId));

describe('Iteration 4 — evidence-bound reflection (deterministic)', () => {
  it('every theme answer is 100% chart-bound to at least one resolvable entity (UVD-4)', () => {
    for (const theme of REFLECTION_THEMES) {
      const answer = buildReflection(DEMO_REPORT, theme);
      expect(answer.status).toBe('ANSWERED');
      expect(answer.truthClass).toBe('REFLECTIVE_HYPOTHESIS');
      expect(answer.evidenceIds.length).toBeGreaterThan(0);
      for (const id of answer.evidenceIds) expect(validEvidence.has(id)).toBe(true);
      // The mapped palace is a concrete chart entity backing the answer.
      expect(answer.chartReferences.palaceId).toBe(answer.palaceId);
    }
  });

  it('is deterministic', () => {
    expect(buildReflection(DEMO_REPORT, 'WORK')).toEqual(buildReflection(DEMO_REPORT, 'WORK'));
  });

  it('out of scope: a mapped area with no resolvable evidence yields OUT_OF_SCOPE + a safe alternative, never speculation', () => {
    // Strip GUAN_LU (WORK) evidence.
    const evidenceIndex = DEMO_REPORT.evidenceIndex.filter(
      (e) => e.evidenceId !== 'palace.GUAN_LU' && !e.evidenceId.startsWith('placement.natal:TAI_YANG'),
    );
    const answer = buildReflection({ ...DEMO_REPORT, evidenceIndex }, 'WORK');
    expect(answer.status).toBe('OUT_OF_SCOPE');
    expect(answer.evidenceIds).toHaveLength(0);
    expect(answer.chartReferences.starIds).toHaveLength(0);
    expect(answer.alternativePalaceId).toBe('MING'); // the personal core, a safe chart-related fallback
  });
});
