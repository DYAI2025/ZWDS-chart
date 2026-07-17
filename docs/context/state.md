# AgileTeam State — bazodiac-zwds-atlas

- **Mode:** CORE (no `metrics/runs.jsonl` baseline → FULL not permitted).
- **Model:** Opus 4.8 (session model). Real-boundary safety net on QA/Review/Audit/Judgment gates: present by default.
- **Branch:** `agileteam/bazodiac-zwds-atlas` (off `main`).
- **Loop caps:** MAX_DEVREVIEW_LOOPS=4, MAX_QA_RETURNS=3 (defaults).
- **Infra note:** executable Plumbline gates (`config/claude/bin/*`, enforcement hooks) NOT installed in this repo. All `plumbline-*-check` gates run as reasoning-level checks and are disclosed as such per gate.

## Phase status

| Phase | Status |
|---|---|
| 0.0 First-run orientation | DONE |
| 0.15 Product Canvas + user confirm | CLEARED (re-confirmed with AMD-001..004 on 2026-07-17) |
| 0.16 Council challenge gate | CLEARED (ran wf_b440a0e9-841; user adopted all 4 points) |
| Canvas + Vision RE-confirm | CLEARED (user "Re-confirm as amended" 2026-07-17) |
| 0.5 PRIL context integrity | CLEARED (reasoning-level; binary absent) |
| 0.7 Spec-sanity audit | CLEARED (PASS, 0 blockers; run wf_cc04fcd3-88f; 5 refinements applied) |
| 0.2 PRD final freeze | CLEARED (FROZEN 2026-07-17) |
| 0.4 Vision + user confirm | CLEARED (user-confirmed with amendments) |
| USER GATE (DoD + matrix + spec-audit) | CLEARED |
| Vision GO gate | CLEARED (explicit user GO 2026-07-17; geocode pin extension confirmed) |
| 1 TDD & QA setup | IN PROGRESS |
| 2..8 | queued |

**Active-feature marker armed:** `docs/context/.active-feature` = `bazodiac-zwds-atlas`.
**Slice-1 build order:** AMD-001 (hard fail-closed, REQ-019) FIRST, then close partials (REQ-011, 012, 016, 017, 018) + reality-ground where external resources allow. REQ-013/015 → slice-2. Release gates AMD-002/003 (incl. geocode) tracked, not slice-1 code blockers.

## Pre-confirmation read-only audit

Run `wf_898eb448-37f` (5 agents, Opus): 12/20 REQs implemented, 8/20 partial, 0 missing.
Validated AS-001 (harden existing prototype). Dominant risk: 12/20 REQs `*-fake` (fixture/mock-only),
never a real FuFirE or real-Chromium boundary. See `docs/traceability.md`.

## Open decisions (not blocking planning; resolved at natural points)

- OQ-001 Release-1 level (Core Seed Preview vs wait for reviewed Sanhe-Sihua)
- OQ-002 persistence/auth model
- OQ-003 practitioner/source-governance reviewer
- OQ-004 production SLOs
- AS-002 glyph policy TW_TRADITIONAL (needs approval)
