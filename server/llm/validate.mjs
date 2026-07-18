// ── Fail-closed grounding guard (REQ-015) ──────────────────────────────────────
// Even WITH a reviewed corpus, the LLM must not introduce any claim that is not anchored
// to (a) a corpus rule actually supplied for this chart and (b) an evidence id that both
// exists in the chart's evidence index AND belongs to the specific deterministic section
// being narrated. Any deviation rejects the ENTIRE synthesis (never a partial mix), and the
// caller falls back to the deterministic sections. This mirrors the deterministic pipeline's
// SECTION_EVIDENCE_REJECTED / AMD-001 fail-closed rule: unsourced content is never shipped.

export class SynthesisRejected extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'SynthesisRejected';
  }
}

// Maximal runs of digits (with internal separators) — "92", "2027", "2,400,000", "2.5".
const DIGIT_RUN = /\d[\d.,]*/g;
const digitGroups = (text) =>
  new Set((String(text).match(DIGIT_RUN) ?? []).map((match) => match.replace(/\D/g, '')).filter(Boolean));

// Numeric containment: the product is explicitly NON-PREDICTIVE and evidence-bound. A
// structurally-valid citation does not stop a hallucinating model from inserting a fabricated
// number, year, percentage, or amount ("92% chance … 2027 … 2,400,000 yuan") into otherwise
// grounded prose. Every numeric token in the prose MUST also appear in the reviewed guidance
// for that section; anything else is ungrounded and rejects the whole synthesis. This is a
// deterministic guard — it cannot police every semantic claim, but it kills the quantitative /
// forecast fabrication the structural guard alone cannot see.
function assertNumbersGrounded(sectionId, prose, guidance) {
  const grounded = digitGroups(guidance);
  for (const number of digitGroups(prose)) {
    if (!grounded.has(number)) {
      throw new SynthesisRejected('LLM_UNGROUNDED_NUMBER', `Section ${sectionId} introduces number "${number}" absent from the reviewed guidance.`);
    }
  }
}

// llmSections: parsed [{ sectionId, prose, citations:[{ ruleKey, evidenceIds:[] }] }].
// context: { allowedRuleKeys:Set, allowedEvidenceIds:Set, sectionIndex:Map<sectionId, baseSection>,
//            guidanceById?:Map<sectionId, guidanceText> }.
// Returns validated, grounded sections (truthClass LLM_SYNTHESIZED). Throws SynthesisRejected
// on the FIRST violation so nothing partially-grounded can leak through.
export function validateSynthesis(llmSections, { allowedRuleKeys, allowedEvidenceIds, sectionIndex, guidanceById }) {
  if (!Array.isArray(llmSections) || llmSections.length === 0) {
    throw new SynthesisRejected('LLM_OUTPUT_EMPTY', 'Synthesis returned no sections.');
  }

  const seen = new Set();
  const out = [];

  for (const section of llmSections) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      throw new SynthesisRejected('LLM_OUTPUT_MALFORMED', 'A synthesized section is not an object.');
    }
    const { sectionId } = section;
    if (typeof sectionId !== 'string' || !sectionIndex.has(sectionId)) {
      throw new SynthesisRejected('LLM_SECTION_UNKNOWN', `Synthesized an unknown sectionId: ${sectionId}.`);
    }
    if (seen.has(sectionId)) {
      throw new SynthesisRejected('LLM_SECTION_DUPLICATE', `Duplicate synthesized section: ${sectionId}.`);
    }
    seen.add(sectionId);

    const base = sectionIndex.get(sectionId);

    const prose = typeof section.prose === 'string' ? section.prose.trim() : '';
    if (!prose) {
      throw new SynthesisRejected('LLM_SECTION_EMPTY', `Empty prose for section ${sectionId}.`);
    }

    // Reject fabricated numbers/years/percentages/amounts not present in the reviewed guidance.
    assertNumbersGrounded(sectionId, prose, guidanceById?.get(sectionId) ?? '');

    if (!Array.isArray(section.citations) || section.citations.length === 0) {
      throw new SynthesisRejected('LLM_SECTION_UNCITED', `Section ${sectionId} has no citations.`);
    }

    const baseEvidence = new Set(base.evidenceIds);
    for (const citation of section.citations) {
      if (!citation || typeof citation !== 'object') {
        throw new SynthesisRejected('LLM_CITATION_MALFORMED', `Malformed citation in section ${sectionId}.`);
      }
      // The rule must be one actually supplied for THIS section (the deterministic ruleType).
      if (citation.ruleKey !== base.ruleType || !allowedRuleKeys.has(citation.ruleKey)) {
        throw new SynthesisRejected('LLM_CITATION_UNKNOWN_RULE', `Section ${sectionId} cites rule ${citation?.ruleKey} not supplied for it.`);
      }
      const evidenceIds = Array.isArray(citation.evidenceIds) ? citation.evidenceIds : [];
      if (evidenceIds.length === 0) {
        throw new SynthesisRejected('LLM_CITATION_UNCITED', `Citation without evidence in section ${sectionId}.`);
      }
      for (const evidenceId of evidenceIds) {
        // Must exist in the chart's evidence index AND belong to this very section — a valid
        // but unrelated evidence id (borrowed from another section) is still a fabrication.
        if (!allowedEvidenceIds.has(evidenceId)) {
          throw new SynthesisRejected('LLM_CITATION_UNKNOWN_EVIDENCE', `Section ${sectionId} cites unknown evidence ${evidenceId}.`);
        }
        if (!baseEvidence.has(evidenceId)) {
          throw new SynthesisRejected('LLM_CITATION_EVIDENCE_MISMATCH', `Section ${sectionId} cites evidence ${evidenceId} that does not belong to it.`);
        }
      }
    }

    out.push({
      ...base,
      truthClass: 'LLM_SYNTHESIZED',
      sourceStatus: 'SOURCE_REVIEWED',
      prose,
      citations: section.citations,
      limitations: [...new Set([...(base.limitations ?? []), 'llm_synthesized', 'non_predictive', 'evidence_bound'])],
    });
  }

  return out;
}
