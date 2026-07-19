// ── Guided reflection (Iteration 4, deterministic) ─────────────────────────
// Binds a user-chosen theme to CONCRETE calculated chart entities and returns a reflection
// prompt — never a prediction. Deterministic templates only (no LLM; the server LLM gate
// stays disabled). Every answer references at least one chart entity (REQ-F-301 / UVD-4:
// 100% chart-bound). If the mapped life area has no resolvable evidence, the answer is
// OUT_OF_SCOPE and a safe, chart-related alternative (the personal core) is offered instead
// (REQ-F-303 — no speculation). Output truthClass is REFLECTIVE_HYPOTHESIS.

import type { NormalizedZwdsReport, PalaceId, StarId, SourceStatus } from './zwdsTypes';
import { placementsForPalace } from './zwdsTypes';

export const REFLECTION_THEMES = ['WORK', 'RELATIONSHIP', 'RESOURCES', 'TRANSITION', 'ORIENTATION'] as const;
export type ReflectionTheme = (typeof REFLECTION_THEMES)[number];

// Theme → life-area palace. TRANSITION maps to the "journey/outer world" palace (QIAN_YI);
// ORIENTATION to the personal core (MING).
const THEME_PALACE: Record<ReflectionTheme, PalaceId> = {
  WORK: 'GUAN_LU',
  RELATIONSHIP: 'FU_QI',
  RESOURCES: 'CAI_BO',
  TRANSITION: 'QIAN_YI',
  ORIENTATION: 'MING',
};

export interface ReflectionAnswer {
  theme: ReflectionTheme;
  status: 'ANSWERED' | 'OUT_OF_SCOPE';
  palaceId: PalaceId;
  /** The concrete chart entities the answer is anchored to (never empty on ANSWERED). */
  chartReferences: { palaceId: PalaceId; starIds: StarId[] };
  evidenceIds: string[];
  /** A safe, chart-related fallback palace when the mapped area is out of scope. */
  alternativePalaceId: PalaceId | null;
  truthClass: 'REFLECTIVE_HYPOTHESIS';
  sourceStatus: SourceStatus;
}

export function buildReflection(report: NormalizedZwdsReport, theme: ReflectionTheme): ReflectionAnswer {
  const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  const palaceId = THEME_PALACE[theme];

  const placements = placementsForPalace(report, palaceId);
  const evidenceIds = [
    `palace.${palaceId}`,
    ...placements.map((placement) => `placement.${placement.placementId}`),
  ].filter((id) => valid.has(id));

  const base = {
    theme,
    palaceId,
    truthClass: 'REFLECTIVE_HYPOTHESIS' as const,
    sourceStatus: report.calculation.sourceStatus,
  };

  // Out of scope: the mapped life area has no resolvable evidence → do not speculate; offer
  // the personal core (Ming) as a safe, chart-related alternative.
  if (evidenceIds.length === 0) {
    const ming = report.palaces.find((palace) => palace.isMing)?.palaceId ?? null;
    return {
      ...base,
      status: 'OUT_OF_SCOPE',
      chartReferences: { palaceId, starIds: [] },
      evidenceIds: [],
      alternativePalaceId: ming && ming !== palaceId ? ming : null,
    };
  }

  return {
    ...base,
    status: 'ANSWERED',
    chartReferences: { palaceId, starIds: placements.map((placement) => placement.starId) },
    evidenceIds,
    alternativePalaceId: null,
  };
}
