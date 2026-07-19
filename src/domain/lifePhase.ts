// ── Guided life phase (Iteration 3) ────────────────────────────────────────
// "Your current life chapter" — which calculated ten-year decade is active now.
// The decade→palace mapping is SERVER-CALCULATED (report.decades); this function never
// invents or guesses it. The only external input is the person's current age, passed in
// explicitly so the function stays pure and deterministic (REQ-F-201). If the age is
// unknown, or no decade contains it, the result is UNKNOWN — the missing basis is named,
// never guessed (fail-closed).

import type { NormalizedZwdsReport, NormalizedDecade, PalaceId, SourceStatus } from './zwdsTypes';

export interface LifePhaseModel {
  status: 'RESOLVED' | 'UNKNOWN';
  currentDecade: NormalizedDecade | null;
  palaceId: PalaceId | null;
  ageReckoningId: string | null;
  evidenceIds: string[];
  /** The decade/palace mapping is a calculated fact; surrounding text is product translation. */
  truthClass: 'CALCULATED_FACT';
  sourceStatus: SourceStatus;
}

/** Whole years between an ISO birth date and an ISO "as of" date. Both explicit → pure. */
export function ageBetween(birthDateIso: string, asOfIso: string): number | null {
  const birth = new Date(`${birthDateIso}T00:00:00Z`);
  const asOf = new Date(`${asOfIso}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(asOf.getTime())) return null;
  let age = asOf.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = asOf.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function buildLifePhase(report: NormalizedZwdsReport, currentAge: number | null): LifePhaseModel {
  const base: Omit<LifePhaseModel, 'status' | 'currentDecade' | 'palaceId' | 'evidenceIds'> = {
    ageReckoningId: report.calculation.ageReckoningId,
    truthClass: 'CALCULATED_FACT',
    sourceStatus: report.calculation.sourceStatus,
  };
  const unknown: LifePhaseModel = { ...base, status: 'UNKNOWN', currentDecade: null, palaceId: null, evidenceIds: [] };

  if (currentAge == null || !report.decades || report.decades.length === 0) return unknown;

  const decade = report.decades.find((item) => currentAge >= item.ageStart && currentAge <= item.ageEnd);
  if (!decade) return unknown; // age outside every calculated window → do not guess a chapter

  const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  const evidenceIds = [`decade.${decade.index}`, `palace.${decade.palaceId}`].filter((id) => valid.has(id));
  // Fail-closed: without resolvable decade evidence there is no verifiable basis to show.
  if (evidenceIds.length === 0) return unknown;

  return { ...base, status: 'RESOLVED', currentDecade: decade, palaceId: decade.palaceId, evidenceIds };
}
