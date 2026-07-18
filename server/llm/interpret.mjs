import { synthesize } from './synthesize.mjs';
import { validateSynthesis, SynthesisRejected } from './validate.mjs';

// ── LLM interpretation orchestrator (REQ-015) ──────────────────────────────────
// Ties grounded synthesis to the fail-closed guard. Returns { sections, llmUsed }.
// If the LLM is disabled (no validated corpus/client) it returns the deterministic sections
// unchanged. If synthesis runs, EVERY grounded section must pass validateSynthesis; on ANY
// rejection or client error the whole attempt is discarded and the deterministic sections are
// returned (llmUsed:false). Grounded sections REPLACE their deterministic counterparts by
// sectionId; sections without reviewed guidance stay deterministic. Nothing unvalidated ships.
//
// `onReject(code, message)` is an optional redaction-safe logging hook (no PII, no key).
export async function interpretSections(deterministicSections, { corpus, client, locale, onReject } = {}) {
  if (!client || !corpus || corpus.status !== 'SOURCE_REVIEWED') {
    return { sections: deterministicSections, llmUsed: false };
  }

  const sectionIndex = new Map(deterministicSections.map((section) => [section.sectionId, section]));
  const allowedRuleKeys = new Set(
    deterministicSections.map((section) => section.ruleType).filter((ruleType) => corpus.rulesByKey.has(ruleType)),
  );
  const allowedEvidenceIds = new Set(deterministicSections.flatMap((section) => section.evidenceIds));
  // The exact reviewed guidance the model was given per section — used to reject any number /
  // year / percentage in the prose that is not present in that guidance (numeric containment).
  const guidanceById = new Map(
    deterministicSections
      .map((section) => [section.sectionId, corpus.rulesByKey.get(section.ruleType)?.guidance?.[locale]])
      .filter(([, guidance]) => typeof guidance === 'string'),
  );

  try {
    const { llmSections, usableSectionIds } = await synthesize(deterministicSections, corpus, client, locale);
    if (usableSectionIds.length === 0) {
      // No section had reviewed guidance — nothing to synthesize, stay deterministic.
      return { sections: deterministicSections, llmUsed: false };
    }

    const grounded = validateSynthesis(llmSections, { allowedRuleKeys, allowedEvidenceIds, sectionIndex, guidanceById });

    const groundedById = new Map(grounded.map((section) => [section.sectionId, section]));
    const merged = deterministicSections.map((section) => groundedById.get(section.sectionId) ?? section);
    return { sections: merged, llmUsed: true };
  } catch (error) {
    const code = error instanceof SynthesisRejected ? error.code : 'LLM_SYNTHESIS_ERROR';
    if (typeof onReject === 'function') onReject(code, String(error?.message ?? error).slice(0, 200));
    // Fail closed: discard the LLM attempt entirely, serve the deterministic sections.
    return { sections: deterministicSections, llmUsed: false };
  }
}
