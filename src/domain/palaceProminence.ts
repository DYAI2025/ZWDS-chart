// ── PALACE_PROMINENCE_PRODUCT_RULE_V1 ──────────────────────────────────────
// A transparent PRODUCT prioritisation of "which life areas stand out most" — NOT a
// traditional strength/brightness/dignity score (that logic is not implemented or
// source-reviewed; see docs/decisions/ADR-palace-prominence-product-rule-v1.md).
//
// Pure function of the normalized report: no Date.now()/random, no feature flags, no I/O.
// Identical for fixture-mode and bff-mode of the same chart (REQ-F-900). Every selection
// carries the evidenceIds of the exact signals that selected it (REQ-D-001); an evidence id
// not present in report.evidenceIndex is dropped fail-closed (same discipline as
// generateDemoSections). Output truthClass is always PRODUCT_TRANSLATION.

import type { NormalizedZwdsReport, PalaceId, SourceStatus } from './zwdsTypes';
import { PALACE_IDS, MAJOR_STAR_IDS, relatedPalaces } from './zwdsTypes';

export const PALACE_PROMINENCE_RULE_ID = 'PALACE_PROMINENCE_PRODUCT_RULE_V1';
export const PALACE_PROMINENCE_RULE_VERSION = '1.0.0';

/** Max prominent palaces surfaced by Iteration 1 (REQ-F-001 "höchstens drei"). */
export const MAX_PROMINENT_PALACES = 3;

// Priority weights make the score behave lexicographically for realistic counts
// (≤ ~14 stars, ≤ ~14 transformations): one major-star palace always outranks any
// number of transformation-only palaces, which always outrank a bare Ming-relation.
// The score is an ordering aid for presentation only — never shown as a number/strength.
const WEIGHT_MAJOR_STAR = 1000;
const WEIGHT_TRANSFORMATION = 10;
const WEIGHT_MING_RELATION = 1;

export type ProminenceSignalKind = 'MAJOR_STAR' | 'TRANSFORMATION' | 'MING_RELATION';

export interface ProminenceSignal {
  kind: ProminenceSignalKind;
  evidenceIds: string[];
}

export interface ProminentPalace {
  palaceId: PalaceId;
  /** Internal ordering aid. NEVER render as a strength value. */
  score: number;
  signals: ProminenceSignal[];
  evidenceIds: string[];
  truthClass: 'PRODUCT_TRANSLATION';
  sourceStatus: SourceStatus;
  /** True when the next included palace has the same score (present it as equivalent). */
  tiedWithNext: boolean;
}

export interface GuidedSummaryModel {
  ruleId: string;
  ruleVersion: string;
  personalCore: {
    palaceId: PalaceId;
    evidenceIds: string[];
    truthClass: 'CALCULATED_FACT';
  } | null;
  prominentPalaces: ProminentPalace[];
  /** True when a first-group tie exceeded the cap and had to be truncated in canonical
   * order (the UI must then say "N areas are equally prominent; showing three"). */
  equalGroupTruncated: boolean;
  sourceStatus: SourceStatus;
}

const canonicalIndex = (id: PalaceId): number => PALACE_IDS.indexOf(id);
const MAJOR_STARS = new Set<string>(MAJOR_STAR_IDS);

interface Candidate {
  palaceId: PalaceId;
  score: number;
  signals: ProminenceSignal[];
  evidenceIds: string[];
}

export function computePalaceProminence(report: NormalizedZwdsReport): GuidedSummaryModel {
  const validEvidence = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  const keep = (ids: string[]): string[] => ids.filter((id) => validEvidence.has(id));

  const ming = report.palaces.find((palace) => palace.isMing) ?? null;

  // Palaces directly related to Ming (opposition + trine), and the relation evidence id
  // that ties each to Ming — used for the MING_RELATION signal.
  const mingRelationEvidence = new Map<PalaceId, string[]>();
  if (ming) {
    const linked = relatedPalaces(report, ming.palaceId);
    const relatedIds: PalaceId[] = [...linked.harmony, ...(linked.opposition ? [linked.opposition] : [])];
    for (const relatedId of relatedIds) {
      const relation = report.relations.find(
        (rel) => rel.palaceIds.includes(ming.palaceId) && rel.palaceIds.includes(relatedId),
      );
      if (relation && validEvidence.has(relation.relationId)) {
        const existing = mingRelationEvidence.get(relatedId) ?? [];
        if (!existing.includes(relation.relationId)) existing.push(relation.relationId);
        mingRelationEvidence.set(relatedId, existing);
      }
    }
  }

  const candidates: Candidate[] = [];
  for (const palace of report.palaces) {
    if (palace.isMing) continue; // the Ming palace is the personal core, not a prominence slot

    const placements = palace.placementIds
      .map((placementId) => report.stars.find((star) => star.placementId === placementId))
      .filter((star): star is NonNullable<typeof star> => Boolean(star));

    const signals: ProminenceSignal[] = [];
    let score = 0;

    // Signal 1 — major-star placements (highest priority).
    const majorEvidence = keep(
      placements
        .filter((star) => MAJOR_STARS.has(star.starId))
        .map((star) => `placement.${star.placementId}`),
    );
    if (majorEvidence.length) {
      score += WEIGHT_MAJOR_STAR * majorEvidence.length;
      signals.push({ kind: 'MAJOR_STAR', evidenceIds: majorEvidence });
    }

    // Signal 2 — calculated transformations sitting in this palace.
    const transformationEvidence = keep(
      Array.from(
        new Set(
          placements.flatMap((star) => star.transformationTypes.map((type) => `transformation.${type}`)),
        ),
      ),
    );
    if (transformationEvidence.length) {
      score += WEIGHT_TRANSFORMATION * transformationEvidence.length;
      signals.push({ kind: 'TRANSFORMATION', evidenceIds: transformationEvidence });
    }

    // Signal 3 — direct relation to the Ming palace (lowest priority).
    const relationEvidence = mingRelationEvidence.get(palace.palaceId) ?? [];
    if (relationEvidence.length) {
      score += WEIGHT_MING_RELATION;
      signals.push({ kind: 'MING_RELATION', evidenceIds: relationEvidence });
    }

    const evidenceIds = Array.from(new Set(signals.flatMap((signal) => signal.evidenceIds)));
    // Fail-closed: a palace with no resolvable evidence cannot be justified — drop it.
    if (score > 0 && evidenceIds.length) {
      candidates.push({ palaceId: palace.palaceId, score, signals, evidenceIds });
    }
  }

  // Sort by score desc; ties broken by canonical PALACE_IDS order — a DETERMINISTIC,
  // byte-stable order that is explicitly NOT a strength ranking (REQ-F-003).
  candidates.sort((a, b) => b.score - a.score || canonicalIndex(a.palaceId) - canonicalIndex(b.palaceId));

  // Select ≤ MAX without splitting a tie group at the boundary.
  const selected: Candidate[] = [];
  let equalGroupTruncated = false;
  let cursor = 0;
  while (cursor < candidates.length && selected.length < MAX_PROMINENT_PALACES) {
    const groupScore = candidates[cursor].score;
    const group: Candidate[] = [];
    while (cursor < candidates.length && candidates[cursor].score === groupScore) {
      group.push(candidates[cursor]);
      cursor += 1;
    }
    if (selected.length + group.length <= MAX_PROMINENT_PALACES) {
      selected.push(...group);
    } else if (selected.length === 0) {
      // First group alone exceeds the cap: no honest way to rank within it, so show the
      // first three in canonical order and flag the truncation (UI states equivalence).
      selected.push(...group.slice(0, MAX_PROMINENT_PALACES));
      equalGroupTruncated = true;
      break;
    } else {
      // A boundary tie would overflow the cap: drop the whole group (show fewer, never a
      // fake rank) — ADR-palace-prominence-product-rule-v1.
      break;
    }
  }

  const prominentPalaces: ProminentPalace[] = selected.map((candidate, index) => ({
    palaceId: candidate.palaceId,
    score: candidate.score,
    signals: candidate.signals,
    evidenceIds: candidate.evidenceIds,
    truthClass: 'PRODUCT_TRANSLATION',
    sourceStatus: report.calculation.sourceStatus,
    tiedWithNext: index + 1 < selected.length && selected[index + 1].score === candidate.score,
  }));

  const personalCore = ming
    ? {
        palaceId: ming.palaceId,
        evidenceIds: keep([`palace.${ming.palaceId}`, 'anchor.ming']),
        truthClass: 'CALCULATED_FACT' as const,
      }
    : null;

  return {
    ruleId: PALACE_PROMINENCE_RULE_ID,
    ruleVersion: PALACE_PROMINENCE_RULE_VERSION,
    personalCore,
    prominentPalaces,
    equalGroupTruncated,
    sourceStatus: report.calculation.sourceStatus,
  };
}
