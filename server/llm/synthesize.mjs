import { SynthesisRejected } from './validate.mjs';

// ── Grounded synthesis prompt (REQ-015) ────────────────────────────────────────
// The LLM may only rephrase/compose the reviewed guidance for THIS chart's deterministic
// sections; it must cite ruleKey + the exact evidenceIds provided for each section and
// invent nothing. Output is strict JSON, then hard-validated by validate.mjs. Only sections
// whose ruleType has reviewed guidance in the corpus are offered — everything else stays on
// the deterministic path, so a partial corpus can only ADD grounded prose, never remove it.

export function buildPrompt(sections, corpus, locale) {
  const usable = sections
    .map((section) => {
      const rule = corpus.rulesByKey.get(section.ruleType);
      if (!rule) return null;
      return {
        sectionId: section.sectionId,
        ruleKey: section.ruleType,
        evidenceIds: section.evidenceIds,
        guidance: rule.guidance[locale],
      };
    })
    .filter(Boolean);

  const system = [
    'You compose short Zi Wei Dou Shu reading notes from reviewed guidance. Strict rules:',
    '- Use ONLY the provided guidance. Introduce NO astrological claim, prediction, number, or fact not present in the guidance for that section.',
    `- For each section, write 1-3 sentences of ${locale} prose grounded solely in that section's guidance.`,
    '- Every section MUST cite its exact ruleKey and ONLY the evidenceIds provided for that same section. Never cite anything else.',
    '- Non-predictive and evidence-bound: no forecasts, no advice, no certainty claims.',
    '- Output STRICT JSON and nothing else: {"sections":[{"sectionId":"…","prose":"…","citations":[{"ruleKey":"…","evidenceIds":["…"]}]}]}.',
  ].join('\n');

  const user = JSON.stringify({ locale, sections: usable });
  return { system, user, usableSectionIds: usable.map((section) => section.sectionId) };
}

// Runs the client and parses JSON. Rejects non-JSON output (fail-closed). Returns the raw
// parsed sections for validateSynthesis to ground-check — this function never trusts the
// model's output shape beyond "it is JSON".
export async function synthesize(sections, corpus, client, locale) {
  const { system, user, usableSectionIds } = buildPrompt(sections, corpus, locale);
  if (usableSectionIds.length === 0) return { llmSections: [], usableSectionIds };

  const text = await client.complete(system, user);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SynthesisRejected('LLM_OUTPUT_NOT_JSON', 'The model did not return JSON.');
  }
  return { llmSections: parsed?.sections, usableSectionIds };
}
