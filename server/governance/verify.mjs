// ── Fail-closed source-governance verification ─────────────────────────────────
// Decides whether a chart's chart-level sourceStatus may be ELEVATED from SOURCE_NEEDED to
// SOURCE_REVIEWED (which drops the AMD-002 not-authoritative notice for the whole report).
// Elevation is the single most authority-conferring action in the product, so it is guarded
// hard and fails closed on ANY doubt: only a valid, hash-pinned reviewer attestation whose
// reviewedRulesetSha256 EXACTLY equals the live ruleset digest — for the same ruleset id and
// version, with a clean crosscheck and no blocked evidence — elevates. Everything else leaves
// the status untouched. It can only ever RAISE SOURCE_NEEDED; it never downgrades, and it never
// elevates over BLOCKED or MISMATCH.

// context: {
//   rulesetId, rulesetVersion, rulesetSha256 (may be null/undefined),
//   crosscheckStatus,            // 'MATCHED' | 'MISMATCH' | 'SOURCE_NEEDED'
//   rawSourceStatus,             // the chart's status before governance
//   hasBlockedEvidence,          // boolean
// }
// loaded: the loadRulesetAttestation() result.
// Returns { sourceStatus, elevated, governanceStatus, reviewer, reason }.
export function verifyRulesetGovernance(context, loaded) {
  const {
    rulesetId,
    rulesetVersion,
    rulesetSha256,
    crosscheckStatus,
    rawSourceStatus,
    hasBlockedEvidence,
  } = context;

  const noElevation = (governanceStatus, reason) => ({
    sourceStatus: rawSourceStatus,
    elevated: false,
    governanceStatus,
    reviewer: null,
    reason,
  });

  // No sign-off configured — the fail-closed default. Chart stays exactly as FuFirE reported it.
  if (!loaded || loaded.status !== 'ATTESTED' || !loaded.attestation) {
    return noElevation('SOURCE_NEEDED', 'no-attestation');
  }

  // Never elevate over a non-SOURCE_NEEDED status. In particular BLOCKED stays BLOCKED, and an
  // already-reviewed status is left as-is (this layer only raises SOURCE_NEEDED).
  if (rawSourceStatus !== 'SOURCE_NEEDED') {
    return noElevation(rawSourceStatus === 'SOURCE_REVIEWED' ? 'SOURCE_REVIEWED' : 'BLOCKED', `raw-status-${rawSourceStatus}`);
  }
  if (hasBlockedEvidence) return noElevation('BLOCKED', 'blocked-evidence');
  if (crosscheckStatus === 'MISMATCH') return noElevation('MISMATCH', 'crosscheck-mismatch');

  // The digest MUST exist and MUST match the reviewer's pinned reviewed digest exactly, for the
  // same ruleset identity. Any absence or mismatch => no authority.
  const { attestation } = loaded;
  if (!rulesetSha256) return noElevation('SOURCE_NEEDED', 'no-live-ruleset-hash');
  if (attestation.rulesetId !== rulesetId) return noElevation('MISMATCH', 'ruleset-id-mismatch');
  if (attestation.rulesetVersion !== rulesetVersion) return noElevation('MISMATCH', 'ruleset-version-mismatch');
  if (attestation.reviewedRulesetSha256.toLowerCase() !== String(rulesetSha256).toLowerCase()) {
    return noElevation('MISMATCH', 'ruleset-hash-mismatch');
  }

  // Verified: a named reviewer signed off this exact ruleset digest. Elevate.
  return {
    sourceStatus: 'SOURCE_REVIEWED',
    elevated: true,
    governanceStatus: 'SOURCE_REVIEWED',
    reviewer: { name: attestation.reviewer.name, org: attestation.reviewer.org ?? null, reviewedAt: attestation.reviewedAt },
    reason: 'attested-hash-match',
  };
}
