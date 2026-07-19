import { describe, it, expect } from 'vitest';
import { DEMO_REPORT } from '@/data/mockZwdsReport';
import { ageBetween, buildLifePhase } from '@/domain/lifePhase';

describe('Iteration 3 — life phase (current decade, fail-closed)', () => {
  it('ageBetween is pure and respects the birthday within a year', () => {
    expect(ageBetween('1984-02-01', '2026-07-19')).toBe(42);
    expect(ageBetween('1984-02-01', '2026-01-15')).toBe(41); // before this year's birthday
    expect(ageBetween('bad', '2026-01-01')).toBeNull();
  });

  it('resolves the active decade from calculated windows for a known age', () => {
    const model = buildLifePhase(DEMO_REPORT, 42);
    expect(model.status).toBe('RESOLVED');
    expect(model.currentDecade?.index).toBe(4);       // 36–45 window
    expect(model.palaceId).toBe('TIAN_ZHAI');
    expect(model.truthClass).toBe('CALCULATED_FACT');
    expect(model.ageReckoningId).toBe('east_asian_nominal.guide-v1');
    expect(model.evidenceIds).toContain('decade.4');
    expect(model.evidenceIds).toContain('palace.TIAN_ZHAI');
  });

  it('never guesses: unknown age, no decades, or an age outside every window → UNKNOWN', () => {
    expect(buildLifePhase(DEMO_REPORT, null).status).toBe('UNKNOWN');
    expect(buildLifePhase({ ...DEMO_REPORT, decades: null }, 42).status).toBe('UNKNOWN');
    expect(buildLifePhase(DEMO_REPORT, 999).status).toBe('UNKNOWN'); // beyond the last window
  });

  it('fail-closed: no resolvable decade evidence → UNKNOWN, not a fabricated chapter', () => {
    const model = buildLifePhase({ ...DEMO_REPORT, evidenceIndex: [] }, 42);
    expect(model.status).toBe('UNKNOWN');
    expect(model.palaceId).toBeNull();
  });
});
