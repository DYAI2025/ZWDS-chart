// ── Truth Classes (canonical, unified) ────────────────────
export const TRUTH_CLASSES = [
  'CALCULATED_FACT',
  'CATALOG_FACT',
  'TRADITIONAL_RULE',
  'PRODUCT_TRANSLATION',
  'REFLECTIVE_HYPOTHESIS',
  'DEMO_FIXTURE',
  'SOURCE_NEEDED',
  // Prose composed by the LLM but grounded in — and validated against — the reviewed corpus
  // and the chart's own evidence (REQ-015). Only appears when a reviewed corpus is configured;
  // ungrounded synthesis is rejected before it can reach a section.
  'LLM_SYNTHESIZED',
] as const;

export type TruthClass = (typeof TRUTH_CLASSES)[number];

export interface TruthClassInfo {
  id: TruthClass;
  colorToken: string;
  iconPattern: string;
}

// Icon patterns are text glyphs; colour is never the only indicator.
export const TRUTH_CLASS_INFO: Record<TruthClass, TruthClassInfo> = {
  CALCULATED_FACT: { id: 'CALCULATED_FACT', colorToken: 'var(--color-reviewed)', iconPattern: '◆' },
  CATALOG_FACT: { id: 'CATALOG_FACT', colorToken: 'var(--color-reviewed)', iconPattern: '●' },
  TRADITIONAL_RULE: { id: 'TRADITIONAL_RULE', colorToken: 'var(--color-raw-umber)', iconPattern: '▲' },
  PRODUCT_TRANSLATION: { id: 'PRODUCT_TRANSLATION', colorToken: 'var(--color-gold-muted)', iconPattern: '◇' },
  REFLECTIVE_HYPOTHESIS: { id: 'REFLECTIVE_HYPOTHESIS', colorToken: 'var(--color-source-needed)', iconPattern: '△' },
  DEMO_FIXTURE: { id: 'DEMO_FIXTURE', colorToken: 'var(--color-gold-muted)', iconPattern: '▣' },
  SOURCE_NEEDED: { id: 'SOURCE_NEEDED', colorToken: 'var(--color-source-needed)', iconPattern: '⚠' },
  LLM_SYNTHESIZED: { id: 'LLM_SYNTHESIZED', colorToken: 'var(--color-gold-muted)', iconPattern: '✎' },
};

export function isValidTruthClass(value: string): value is TruthClass {
  return (TRUTH_CLASSES as readonly string[]).includes(value);
}
