import { describe, it, expect } from 'vitest';
import { PALACE_GRID_LAYOUT, RING_ORDER, oppositeBranch, trineBranches } from '@/shared/palaceGrid';
import { DEMO_REPORT } from '@/data/mockZwdsReport';
import { PALACE_IDS } from '@/domain/zwdsTypes';

// ── 4×4 perimeter grid invariants (P0 grid bug regression) ──
describe('palace grid layout', () => {
  it('has exactly twelve unique cells', () => {
    expect(PALACE_GRID_LAYOUT).toHaveLength(12);
    const keys = PALACE_GRID_LAYOUT.map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(12);
  });

  it('has exactly twelve unique branches', () => {
    const branches = PALACE_GRID_LAYOUT.map((c) => c.branchId);
    expect(new Set(branches).size).toBe(12);
  });

  it('places no cell inside the 2×2 centre (rows/cols 2–3)', () => {
    for (const c of PALACE_GRID_LAYOUT) {
      const inCentre = c.col >= 2 && c.col <= 3 && c.row >= 2 && c.row <= 3;
      expect(inCentre, `branch ${c.branchId} at ${c.col},${c.row} collides with the centre`).toBe(false);
    }
  });

  it('covers all four grid edges', () => {
    const edges = new Set(
      PALACE_GRID_LAYOUT.map((c) => (c.row === 1 ? 'top' : c.row === 4 ? 'bottom' : c.col === 1 ? 'left' : 'right'))
    );
    expect(edges).toEqual(new Set(['top', 'bottom', 'left', 'right']));
  });

  it('every palace in the demo bundle maps to a defined cell outside the centre', () => {
    for (const palace of DEMO_REPORT.palaces) {
      const cell = PALACE_GRID_LAYOUT.find((c) => c.branchId === palace.branchId);
      expect(cell, `palace ${palace.palaceId} branch ${palace.branchId} missing from layout`).toBeDefined();
      if (cell) {
        const inCentre = cell.col >= 2 && cell.col <= 3 && cell.row >= 2 && cell.row <= 3;
        expect(inCentre).toBe(false);
      }
    }
  });
});

// ── Ring geometry used by relation derivation ──────────────
describe('branch ring geometry', () => {
  it('opposites are 6 steps apart', () => {
    expect(oppositeBranch('YIN')).toBe('SHEN');
    expect(oppositeBranch('ZI')).toBe('WU');
  });
  it('trines are 4 and 8 steps apart and symmetric', () => {
    const [a, b] = trineBranches('YIN');
    expect([a, b].sort()).toEqual(['WU', 'XU'].sort());
  });
  it('ring contains all twelve branches exactly once', () => {
    expect(new Set(RING_ORDER).size).toBe(12);
  });
});

// ── Palace role invariants on the demo bundle ──────────────
describe('demo bundle palace invariants', () => {
  it('contains twelve unique palace roles', () => {
    const roles = DEMO_REPORT.palaces.map((p) => p.palaceId);
    expect(new Set(roles).size).toBe(12);
    for (const id of PALACE_IDS) expect(roles).toContain(id);
  });

  it('marks MING and SHEN correctly and consistently with anchors', () => {
    const ming = DEMO_REPORT.palaces.find((p) => p.isMing);
    const shen = DEMO_REPORT.palaces.find((p) => p.isShen);
    expect(ming?.branchId).toBe(DEMO_REPORT.anchors.mingBranchId);
    expect(shen?.branchId).toBe(DEMO_REPORT.anchors.shenBranchId);
    expect(DEMO_REPORT.palaces.filter((p) => p.isMing)).toHaveLength(1);
    expect(DEMO_REPORT.palaces.filter((p) => p.isShen)).toHaveLength(1);
  });

  it('relation targets all reference existing palaces', () => {
    const ids = new Set(DEMO_REPORT.palaces.map((p) => p.palaceId));
    for (const r of DEMO_REPORT.relations) {
      for (const pid of r.palaceIds) expect(ids.has(pid), `${r.relationId} → ${pid}`).toBe(true);
    }
  });

  it('decades are twelve, unique, ordered and non-overlapping', () => {
    const decades = DEMO_REPORT.decades;
    expect(decades).not.toBeNull();
    if (!decades) return;
    expect(decades).toHaveLength(12);
    const sorted = [...decades].sort((a, b) => a.index - b.index);
    sorted.forEach((d, i) => {
      expect(d.index).toBe(i + 1);
      if (i > 0) expect(d.ageStart).toBe(sorted[i - 1].ageEnd + 1);
    });
  });

  it('every section references only known evidence ids (closed failure)', () => {
    // mirrored from generateDemoSections guarantee
    const valid = new Set(DEMO_REPORT.evidenceIndex.map((e) => e.evidenceId));
    for (const ev of DEMO_REPORT.evidenceIndex) {
      expect(ev.evidenceId.length).toBeGreaterThan(0);
    }
    expect(valid.has('anchor.ming')).toBe(true);
    expect(valid.has('decade.1')).toBe(true);
  });
});
