import fs from 'node:fs';
import crypto from 'node:crypto';
import { z } from 'zod';

// ── Source-governance attestation ──────────────────────────────────────────────
// The report is authoritative (SOURCE_REVIEWED, no AMD-002 notice) ONLY when a named
// source-governance reviewer has independently signed off the ruleset by pinning its exact
// content digest. That sign-off is this attestation: a reviewer + provenance + the reviewed
// ruleset sha256. It is NOT shipped by default (no path) — so with no attestation the chart
// stays SOURCE_NEEDED / not-authoritative. A hash/sign-off is never fabricated: this loader
// only validates and hash-pins an attestation that a human actually produced.

const provenanceSchema = z
  .object({ citation: z.string().min(1), reviewer: z.string().min(1), reviewedAt: z.string().min(1) })
  .strict();

export const rulesetAttestationSchema = z
  .object({
    attestationId: z.string().min(1),
    rulesetId: z.string().min(1),
    rulesetVersion: z.string().min(1),
    // The reviewed ruleset content digest. Must equal the live ruleset_sha256 to elevate.
    reviewedRulesetSha256: z.string().regex(/^[a-f0-9]{64}$/i),
    reviewer: z.object({ name: z.string().min(1), org: z.string().min(1).optional() }).strict(),
    reviewedAt: z.string().min(1),
    provenance: provenanceSchema,
    scope: z.array(z.literal('ruleset')).min(1),
  })
  .strict();

export class AttestationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'AttestationError';
  }
}

export function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Returns { status:'SOURCE_NEEDED', attestation:null } when none is configured, or a validated,
// hash-pinned { status:'ATTESTED', attestation, sha256 }. Throws AttestationError when an
// attestation IS declared (RULESET_ATTESTATION_PATH set) but is missing / hash-mismatched /
// malformed — a declared-but-unverifiable sign-off must fail closed (refuse boot), never
// silently confer authority.
export function loadRulesetAttestation(config) {
  if (!config.RULESET_ATTESTATION_PATH) return { status: 'SOURCE_NEEDED', attestation: null };

  let raw;
  try {
    raw = fs.readFileSync(config.RULESET_ATTESTATION_PATH);
  } catch {
    throw new AttestationError('RULESET_ATTESTATION_MISSING', 'RULESET_ATTESTATION_PATH is set but the file cannot be read.');
  }

  const sha256 = sha256Hex(raw);
  if (!config.RULESET_ATTESTATION_SHA256 || sha256 !== config.RULESET_ATTESTATION_SHA256) {
    throw new AttestationError('RULESET_ATTESTATION_HASH_MISMATCH', 'Attestation content hash does not match the pinned RULESET_ATTESTATION_SHA256.');
  }

  let attestation;
  try {
    attestation = rulesetAttestationSchema.parse(JSON.parse(raw.toString('utf8')));
  } catch {
    throw new AttestationError('RULESET_ATTESTATION_INVALID', 'Attestation does not satisfy the attestation schema.');
  }

  return { status: 'ATTESTED', attestation, sha256 };
}
