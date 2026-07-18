import fs from 'node:fs';
import crypto from 'node:crypto';
import { z } from 'zod';

// ── Reviewed rules corpus ──────────────────────────────────────────────────────
// A reviewed corpus is the ONLY interpretive source the LLM may draw from (REQ-015).
// It must be genuinely source-reviewed (sourceStatus === 'SOURCE_REVIEWED') and its raw
// bytes pinned via LLM_CORPUS_SHA256, so an unreviewed, tampered, or swapped corpus can
// never silently ground the synthesis. No corpus configured => SOURCE_NEEDED => the LLM
// stays disabled and the deterministic sections are served. This is a fail-closed default,
// not a TODO: the product must never emit unsourced interpretation as if it were real.

const localizedGuidance = z
  .object({ 'de-DE': z.string().min(1), 'en-US': z.string().min(1) })
  .strict();

const provenanceSchema = z
  .object({ citation: z.string().min(1), reviewer: z.string().min(1), reviewedAt: z.string().min(1) })
  .strict();

const corpusRuleSchema = z
  .object({
    // ruleKey matches generateSections' ruleType (STAR_IN_PALACE, STAR_WITH_TRANSFORMATION, …).
    ruleKey: z.string().min(1),
    ruleVersion: z.string().min(1),
    // Reviewed interpretive guidance the LLM may rephrase/compose — never exceed.
    guidance: localizedGuidance,
    provenance: provenanceSchema,
  })
  .strict();

export const reviewedCorpusSchema = z
  .object({
    corpusId: z.string().min(1),
    corpusVersion: z.string().min(1),
    sourceStatus: z.literal('SOURCE_REVIEWED'),
    provenance: provenanceSchema,
    rules: z.array(corpusRuleSchema).min(1),
  })
  .strict();

export class CorpusError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'CorpusError';
  }
}

export function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Returns { status:'SOURCE_NEEDED', rulesByKey:Map } when no corpus is configured, or a
// validated, hash-pinned { status:'SOURCE_REVIEWED', corpusId, corpusVersion, sha256,
// rulesByKey } otherwise. Throws CorpusError when a corpus IS declared (LLM_CORPUS_PATH set)
// but is missing / hash-mismatched / malformed — a declared-but-unverifiable corpus must fail
// closed (refuse boot), never degrade to ungrounded output.
export function loadReviewedCorpus(config) {
  if (!config.LLM_CORPUS_PATH) return { status: 'SOURCE_NEEDED', rulesByKey: new Map() };

  let raw;
  try {
    raw = fs.readFileSync(config.LLM_CORPUS_PATH);
  } catch {
    throw new CorpusError('LLM_CORPUS_MISSING', 'LLM_CORPUS_PATH is set but the corpus file cannot be read.');
  }

  const sha256 = sha256Hex(raw);
  if (!config.LLM_CORPUS_SHA256 || sha256 !== config.LLM_CORPUS_SHA256) {
    throw new CorpusError('LLM_CORPUS_HASH_MISMATCH', 'Corpus content hash does not match the pinned LLM_CORPUS_SHA256.');
  }

  let parsed;
  try {
    parsed = reviewedCorpusSchema.parse(JSON.parse(raw.toString('utf8')));
  } catch {
    throw new CorpusError('LLM_CORPUS_INVALID', 'Corpus does not satisfy the reviewed-corpus schema.');
  }

  const rulesByKey = new Map(parsed.rules.map((rule) => [rule.ruleKey, rule]));
  return {
    status: 'SOURCE_REVIEWED',
    corpusId: parsed.corpusId,
    corpusVersion: parsed.corpusVersion,
    sha256,
    rulesByKey,
  };
}
