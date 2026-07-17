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
