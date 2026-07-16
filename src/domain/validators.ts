import { PALACE_IDS, type PalaceId } from './zwdsTypes';
import { TRUTH_CLASSES, type TruthClass } from './truthTypes';

// ── Palace ID validation ───────────────────────────────────
export function validatePalaceIds(palaceIds: string[]): boolean {
  if (palaceIds.length !== 12) return false;
  const unique = new Set(palaceIds);
  if (unique.size !== 12) return false;
  return palaceIds.every((id) => PALACE_IDS.includes(id as PalaceId));
}

// ── Decade window validation ───────────────────────────────
export function validateDecadeWindows(decades: { index: number }[]): boolean {
  if (decades.length !== 12) return false;
  const indices = decades.map((d) => d.index);
  const unique = new Set(indices);
  return unique.size === 12;
}

// ── Truth class validation ─────────────────────────────────
export function isValidTruthClass(value: string): value is TruthClass {
  return (TRUTH_CLASSES as readonly string[]).includes(value);
}

// ── Palace ID existence check ──────────────────────────────
export function isValidPalaceId(value: string): value is PalaceId {
  return (PALACE_IDS as readonly string[]).includes(value);
}
