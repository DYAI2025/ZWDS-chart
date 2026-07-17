# Phase 0.7 Spec-Sanity Audit — bazodiac-zwds-atlas

Run: `wf_cc04fcd3-88f` (spec-auditor, Opus, ultrathink-craftsmanship full ×1 + konfabulations-audit). Adversarial blocker-verify stage: 0 blockers to verify.

**Verdict: PASS.** Blockers: 0. Verified blockers: 0.

Charter reminder: this gate certifies **reasoning quality + claim provenance only** — it is NOT evidence the system works. Real correctness (real FuFirE/Chromium boundaries, catalog authenticity) is still owed at Gates A–C and the AMD-002/003 release gates.

## Why PASS

The dominant reality risk (12/20 REQs proven only against a self-authored fixture/mocks) is **not a silent premise**: surfaced verbatim in `traceability.md` (Reality Ledger RED 12/20), self-labelled `SOURCE_NEEDED`/`DEMO_FIXTURE` in the fixture, documented in `KNOWN_LIMITATIONS.md`, and demoted by AMD-002 (catalog sign-off gate) + AMD-003 (real-FuFirE pin gate) before any authoritative public claim. AMD-001 hard fail-closed makes the failure mode safe (refuse, not fabricate). No halo laundering — user confirmation is scoped to intent, not technical correctness.

## Concerns (5) — all applied before PRD freeze

1. **[important] AC-010 referenced slice-2 PDF** → qualified: PDF path is slice-2, out of slice-1 AC scope.
2. **[important] REQ-009 "verified Hanzi" equivocation** → reworded to "catalog Hanzi (glyph/policy-verified, NOT content-authoritative; gated by AMD-002)".
3. **[minor] TRC-013/015 wired-in-prod=yes overstates** → annotated as stub/partial (route reachable ≠ capability complete).
4. **[minor] geocode release-gate parity** → AMD-003 extended to the geocode boundary (flagged for user veto at USER GATE).
5. **[minor] AMD-001 × AMD-003 coupling** → sequencing note: reconcile real FuFirE response vs fixture BEFORE flipping the public claim.

## Konfabulations-audit — claim provenance (headline)

- **belegt** (evidence in-repo): browser→BFF isolation (REQ-003); DTO→FuFirE mapping + pinned-contract validation code (REQ-004); the read-only audit counts; fixture immutability + DEMO_FIXTURE labelling (REQ-014).
- **ableitbar**: 12-palace Sanfang-Sizheng topology; secrets/log-redaction properties; a11y mechanics (no WCAG overclaim); fixture↔mock reproducibility (explicitly not a real-FuFirE equivalence claim); no-deterministic-claims copy; "prototype viable to harden" (fixture-level).
- **ungeprueft** (must NOT propagate as fact): the pinned contract matches the real FuFirE API shape; "traceable to real DATA" (CAN-003); catalog Hanzi authoritative; geocode backend-confirmed from a real provider; PDF renders Pinyin correctly; an LLM component exists. → all already gated by AMD-002/003 or deferred (slice-2); none used as a build premise.
- **nicht-behaupten** (correctly NOT asserted anywhere): reviewed ruleset/catalog SHA-256 hashes + school label (left null/SOURCE_NEEDED, "never fabricate"); quantified market demand / audience size.
