# Decision Log — bazodiac-zwds-atlas

| # | Date | Decision | Who | Note |
|---|---|---|---|---|
| D-001 | 2026-07-17 | Start `/agileteam` from the Plumbline intake package (Canvas/PRD/Vision/traceability, READY_FOR_USER_CONFIRMATION). | orchestrator | Start-state classified `VISION_MISSING`; planning/coding blocked until confirm. |
| D-002 | 2026-07-17 | Ran read-only repo audit before confirmation to validate AS-001. | orchestrator | Run `wf_898eb448-37f`. 12/20 implemented, 8/20 partial, 0 missing; 12/20 reality-fake. |
| D-003 | 2026-07-17 | User confirmed Product Canvas + Product Vision as the basis for AgileTeam planning. | **user** | Via confirmation gate ("Confirm as-is") + verbatim phrase. Canvas + Vision → `user-confirmed`. |
| D-004 | 2026-07-17 | AS-001 upgraded ASSUMPTION → evidence-confirmed (VIS-008). | orchestrator | Backed by D-002 audit. |
| D-005 | 2026-07-17 | Wrote artifacts to canonical paths on branch `agileteam/bazodiac-zwds-atlas`; PRD kept `foundation-confirmed`, final freeze deferred to Phase 0.5 (after council + spec-sanity). | orchestrator | Respects "council runs before PRD finalize". |
| D-006 | 2026-07-17 | Phase 0.16 council challenge gate ran (Challenger/Advisor/Critic). All 3 converged "pull-pivot", 5 legitimate-blockers. | orchestrator | Run `wf_b440a0e9-841`, 3 independent agent types. |
| D-007 | 2026-07-17 | User adopted ALL FOUR council steer options → AMD-001..004. Canvas + Vision returned to `draft`; re-confirm required. | **user** | No agent self-confirm. |
| D-008 | 2026-07-17 | Scope shift (user-authored): slice-1 narrowed to 18 REQs; REQ-013 (PDF) + REQ-015 (LLM) → slice-2. **Original Goal (20 REQs) NOT reduced.** | **user** | Iteration status separated from Original Goal status. |
| D-009 | 2026-07-17 | User re-confirmed Canvas + Vision as amended. | **user** | "Re-confirm as amended". |
| D-010 | 2026-07-17 | Phase 0.7 spec-sanity PASS (0 blockers). 5 refinements applied before freeze; PRD FROZEN. | orchestrator | Run `wf_cc04fcd3-88f`; see `docs/context/spec-audit-2026-07-17.md`. |
| D-011 | 2026-07-17 | Extended AMD-003 real-boundary pin to the geocode provider (parity). Flagged for user veto at USER GATE. | orchestrator | Consistent reading of AMD-003; not silent — surfaced for decision. |
| D-012 | 2026-07-17 | User gave explicit Vision GO. Development starts (Phase 1). `.active-feature` marker armed. | **user** | Bounded autonomy; Watcher may pause; user final authority. |
| D-013 | 2026-07-17 | User confirmed extending AMD-003 real-boundary pin to the geocode provider. | **user** | Parity with FuFirE pin. |
| D-014 | 2026-07-17 | Wired PRIL enforcement CLIs locally (gitignored wrappers pinning /usr/bin/python3) after the Stop hook blocked on missing CLIs; fixed the real gate failures it caught (confirmation markers, scope heading). Gates now machine-provable: context+scope PASS. | orchestrator | Honest fix, not a bypass; reality-check deferred to Gate C. |
| D-015 | 2026-07-17 | T02 (AMD-001 hard fail-closed) implemented test-first, independently reviewed (code PASS, security PASS, Watcher value-risk). Reviewer strengthenings applied. Honest reality ledger created (integration-fake; reality-check RED at integration floor — real-boundary pending AMD-003/T11). Iteration 1/4 complete. | orchestrator | Watcher value-risk = user-accepted release-gated RED; code proceeds, value cert pending. |
| D-016 | 2026-07-17 | T07 (REQ-017): report-pdf token-check reorder + reportStore expiry/prune/token tests. security PASS; code changes-requested (tautological prune test) -> fixed with reportCount/resetReports introspection, mutation-verified. Surfaced+fixed a latent test-isolation bug. | orchestrator | Test strengthened, not gamed. |
| D-017 | 2026-07-17 | T04 (REQ-011) code done + reviewed (code PASS). Watcher BLOCK on the reality floor (integration-fake < integration); escalation-asymmetry forbids self-downgrade. Escalating the slice-1 done-bar decision to the user; paused. | orchestrator->user | Watcher: keep code, user owns the done-bar / AMD-003. |
| D-018 | 2026-07-17 | User chose SCOPE SHIFT A: reconcile the data contract to the real FuFirE API (CONTRA-001). Deep contract analysis dispatched; plan re-scope pending. | **user** | Biggest, most valuable work; re-founds the data layer. |
| D-019 | 2026-07-17 | Added `.env.example` to the Canvas Allowed change scope (scope-check flagged it). Reason: I edited .env.example to SCRUB the secrets the user accidentally pasted there — a security remediation; it is a standard tracked config file of the same class already in scope. Recorded transparently, not silent scope-creep. | orchestrator | User may revert if undesired. |
| D-020 | 2026-07-17 | RECON-server done: server data contract re-founded on real FuFirE; live pin PASS; REQ-004/005 -> real-boundary-smoke; reality-check PASSES at real-boundary-smoke. Review fixes applied (fail-open crosscheck -> allowlist; pin collect() dead fields). CONTRA-001 resolved for calculate boundary. | orchestrator | Landmark: reality gate green after being RED all engagement. |
| D-021 | 2026-07-17 | USER ACCEPTED slice-1 at the acceptance gate (Gate C PASS-WITH-RED + Gate D ACCEPT-WITH-NOTES; all actionable findings remediated). Residuals recorded as user-owned release-gates, not slice-1 blockers. | **user** | /agileteam complete through Phase 7. |

## Open contradictions ledger

**CONTRA-001 (2026-07-17, RESOLVED for the calculate boundary):** RECON-server re-founded the
data contract on the REAL FuFirE response; the live pin now returns **PASS** (parse + invariants +
normalize + generateSections all hold), REQ-004/REQ-005 are **real-boundary-smoke** in the ledger,
and `plumbline-reality-check` passes at `real-boundary-smoke`. Remaining: the **geocode** boundary
(REQ-002) is still `integration-fake` (unpinned — user supplied Google keys, a separate provider
design), and the BFF↔FE transformation-id wire (`HUA_QUAN` vs `HUA_QU`) closes in RECON-client.
Original finding retained below for the record.

**CONTRA-001 (2026-07-17, original — escalated to user):** The AMD-003 real-boundary pin
(`node --env-file=.env scripts/amd003-pin.mjs`, real FuFirE) proved the real `/v1/calculate/zwds`
contract materially diverges from the self-authored golden fixture — real transformation id is
`HUA_QUAN` (which the architecture gate BANS), real response adds a `catalog` object + stars
`ZUO_FU`/`WEN_QU`, different `normalized_input`/palace structure, and a different ruleset-hash set.
The current strict schema hard-rejects real responses (`FUFIRE_CONTRACT_MISMATCH`); AMD-001 would
refuse them. This contradicts the confirmed value promise CAN-003/VIS-004 ("traceable to REAL
data"). Full report: `docs/reality/AMD-003-pin-2026-07-17.md`. **Blocks the public "traceable to
real data" claim. Requires a user SCOPE SHIFT decision** (reconcile the contract to reality vs
defer). Not laundered, not self-resolved.

The other fixture-only REQs remain surfaced as `value-risk` in the traceability matrix, not
laundered into "known limitations"; user reclassification only.

**CONTRA-001 fully reconciled (calculate boundary):** RECON-server + RECON-client + RECON-verify
all landed — the BFF↔FE `HUA_QUAN` wire is closed (fixture-mode and bff-mode agree), the live pin
returns PASS, and Gate D re-verified the reconciliation as genuine. Geocode boundary (REQ-002)
remains the one open external boundary (`integration-fake`, unpinned) — a user-owned release gate.

## D-022 — REQ-015 fail-closed LLM synthesis pipeline (slice-2, 2026-07-18)

**Scope-Shift decision (user):** build the fail-closed LLM pipeline as infrastructure; do NOT
enable ungrounded synthesis. `Original Goal Status` (user-facing LLM interpretation) stays
**NOT DONE** — it is blocked on a genuinely source-reviewed rules corpus, which cannot be
fabricated. `Current Iteration Status`: pipeline built + guard-tested + shipped DISABLED.

**Design:** interpretation stays deterministic (`generateSections`) by default. When — and only
when — a validated, hash-pinned reviewed corpus is configured, the LLM may compose prose GROUNDED
in that corpus + the chart's own evidence. Multi-layer fail-closed: (1) env gate refuses boot
unless `LLM_ENABLED` + `SOURCE_REVIEWED` + corpus path + `LLM_CORPUS_SHA256` + api key; (2)
`loadReviewedCorpus` hash-pins the corpus bytes (mismatch/invalid/missing => refuse boot); (3)
`validateSynthesis` rejects any citation to a rule not supplied for the section, any evidence id
not belonging to the section, empty/uncited/duplicate/malformed/non-JSON output, and any number
not present in the reviewed guidance (numeric containment); (4) ANY rejection discards the entire
synthesis and serves the deterministic sections — never a partial mix, never a 500.

**Adversarial verification:** 6-vector attack+verify sweep (semantic-fabrication, evidence-borrow,
env-gate-bypass, corpus-hash-bypass, type-confusion, partial-mix-leak) → **0 confirmed fail-closed
violations**. The one surfaced item (structural guard cannot police non-numeric semantic
faithfulness) is a documented architectural limit, mitigated by numeric containment + the
requirement that the corpus itself be human-reviewed; it is not a fail-closed violation. This is
why the feature stays gated behind a reviewed corpus.

**Anti-fabrication invariant preserved:** in the shipping/default config (no corpus) nothing LLM
ships; `llmConfigured:false`, `llmCorpusStatus:SOURCE_NEEDED`, deterministic sections only.

## D-023 — Source-governance elevation layer (authoritative status, 2026-07-18)

**User decision:** build the fail-closed source-governance verify layer AND thread it into the
report so a genuine reviewer attestation elevates the chart to authoritative. I may NOT fabricate
a reviewed hash or a reviewer sign-off, so the real reviewed status stays blocked on a human
reviewer; the buildable, honest deliverable is the verification MECHANISM, shipped INERT.

**Design:** the chart-level `sourceStatus` (raw.quality.source_status) is the single authority
switch — `report.calculation.sourceStatus === 'SOURCE_REVIEWED'` drops the AMD-002 notice
(`reportIsSourceReviewed`). server/governance/attestation.mjs loads a reviewer attestation and
hash-pins its bytes (RULESET_ATTESTATION_SHA256; declared-but-unverifiable => refuse boot).
server/governance/verify.mjs elevates SOURCE_NEEDED -> SOURCE_REVIEWED ONLY when the attestation's
reviewedRulesetSha256 EXACTLY equals the live ruleset_sha256 (same id+version), rawSourceStatus is
SOURCE_NEEDED, there is no BLOCKED evidence, and the crosscheck is not MISMATCH. It only ever
RAISES SOURCE_NEEDED — never downgrades, never elevates over BLOCKED/MISMATCH/null-hash. Threaded
through normalizeRaw so the elevated status is consistent across the evidence index + sections;
surfaced on /api/zwds/ruleset-status (governance.reviewedBy) + /api/config-status (rulesetGovernance).

**Adversarial verification:** 6-vector attack+verify sweep (fabricate-authority, attestation-tamper,
hash-mismatch-elevate, blocked-or-mismatch-elevate, env-gate-bypass, id-version-null-confusion) →
**0 confirmed authority bypasses**. Authority cannot be conferred without a valid hash-matching
attestation.

**Anti-fabrication preserved:** ships with NO attestation => every chart stays SOURCE_NEEDED /
not-authoritative (default verified). REQ-021 -> integration-fake. The catalogue-digest governance
(a separate SOURCE_NEEDED item) is NOT built here.

## D-024 — Catalogue-digest governance (2026-07-18)

Same fail-closed pattern applied to the FE label catalogue. CATALOG_CONTENT_SHA256 pins the
deterministic content digest (drift guard: a test recomputes and asserts equality, so silent
catalogue drift fails the build) — a change-detection pin, NOT a review claim. CATALOG_SHA256
stays null (the reviewed digest a named catalogue reviewer would pin; never fabricated).
catalogueGovernanceStatus() is SOURCE_REVIEWED only when the reviewed pin exactly equals the
content digest; drifted/absent/mismatched => SOURCE_NEEDED. Surfaced on the Method page. FE-only,
self-contained pure guard (5 unit cases); no report-authority threading, so no adversarial sweep.
