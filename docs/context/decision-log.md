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

## Open contradictions ledger

None recorded (no `CONTRA-<id>`). The 12 reality-fake REQs are surfaced as `value-risk` in the
traceability matrix, not laundered into "known limitations"; user reclassification only.
