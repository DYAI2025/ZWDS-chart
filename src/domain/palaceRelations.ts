// ── Guided relations (Iteration 2) ─────────────────────────────────────────
// A plain-language view of how a life area connects to others. The RELATIONS are
// CALCULATED_FACT (read straight from report.relations); only the surrounding sentences
// are PRODUCT_TRANSLATION. Nothing is invented: a relation is included ONLY when its
// relationId resolves in report.evidenceIndex (REQ-F-101 — no fabricated connections).
// Pure function; identical for fixture-mode and bff-mode of the same chart.

import type { NormalizedZwdsReport, PalaceId, SourceStatus } from './zwdsTypes';

export interface GuidedRelationEdge {
  /** The other life area on this edge (never the palace itself). */
  palaceId: PalaceId;
  /** Resolvable evidence id (the calculated relationId) that backs this edge. */
  evidenceIds: string[];
}

export interface GuidedRelationsModel {
  palaceId: PalaceId;
  /** Supporting (San-Fang trine) partners, if a calculated harmony relation exists. */
  harmony: GuidedRelationEdge[];
  /** Opposite (facing) life area, if a calculated opposition relation exists. */
  opposition: GuidedRelationEdge | null;
  hasAny: boolean;
  /** The relations themselves are calculated facts. */
  truthClass: 'CALCULATED_FACT';
  sourceStatus: SourceStatus;
}

export function buildGuidedRelations(report: NormalizedZwdsReport, palaceId: PalaceId): GuidedRelationsModel {
  const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  const relations = report.relations.filter(
    (relation) => relation.palaceIds.includes(palaceId) && valid.has(relation.relationId),
  );

  const harmony: GuidedRelationEdge[] = relations
    .filter((relation) => relation.type === 'SQUARE_HARMONY')
    .flatMap((relation) =>
      relation.palaceIds
        .filter((id) => id !== palaceId)
        .map((id) => ({ palaceId: id, evidenceIds: [relation.relationId] })),
    );

  const oppositionRelation = relations.find((relation) => relation.type === 'OPPOSITION');
  const oppositionPalace = oppositionRelation?.palaceIds.find((id) => id !== palaceId);
  const opposition: GuidedRelationEdge | null =
    oppositionRelation && oppositionPalace
      ? { palaceId: oppositionPalace, evidenceIds: [oppositionRelation.relationId] }
      : null;

  return {
    palaceId,
    harmony,
    opposition,
    hasAny: harmony.length > 0 || opposition !== null,
    truthClass: 'CALCULATED_FACT',
    sourceStatus: report.calculation.sourceStatus,
  };
}
