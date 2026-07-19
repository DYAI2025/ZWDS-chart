// ── Guided-view feature flags (Western-adaptation iterations 1–4) ──────────
// Each Guided product-translation layer is individually switchable so any iteration
// can be disabled without touching calculation data or the traditional views
// (docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md — Rollback and safety).
//
// Pure product-translation domain rules (src/domain/palaceProminence.ts, reflection.ts)
// MUST NOT import this module — they stay flag-free and node-test-safe. Only UI reads flags.

export interface FeatureFlags {
  /** Iteration 1 — Guided Summary (personal core + up to three prominent palaces). */
  guidedSummary: boolean;
  /** Guided is the default report sub-view; the traditional atlas stays one click away. */
  guidedDefault: boolean;
  /** Iteration 2 — plain-language palace relationships. */
  guidedRelations: boolean;
  /** Iteration 3 — "your current life chapter" (active decade). */
  guidedLifePhase: boolean;
  /** Iteration 4 — evidence-bound reflection. LLM stays disabled regardless (server gate). */
  guidedReflection: boolean;
}

// import.meta.env is only populated in the Vite/browser + jsdom-component contexts.
// Read defensively so a missing env key falls back to the documented default.
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

function envFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

export const FEATURE_FLAGS: FeatureFlags = {
  guidedSummary: envFlag(env.VITE_GUIDED_SUMMARY, true),
  guidedDefault: envFlag(env.VITE_GUIDED_DEFAULT, true),
  guidedRelations: envFlag(env.VITE_GUIDED_RELATIONS, true),
  guidedLifePhase: envFlag(env.VITE_GUIDED_LIFE_PHASE, true),
  guidedReflection: envFlag(env.VITE_GUIDED_REFLECTION, true),
};
