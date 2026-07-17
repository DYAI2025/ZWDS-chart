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
| 0.15 Product Canvas + user confirm | CLEARED, then AMENDED (council AMD-001..004) → re-confirm pending |
| 0.16 Council challenge gate | CLEARED (ran wf_b440a0e9-841; user adopted all 4 points) |
| Canvas + Vision RE-confirm | PENDING (mandatory after amendments) |
| 0.2 PRD (drafted, foundation-confirmed) | PENDING final freeze (Phase 0.5) |
| 0.4 Vision + user confirm | CLEARED, then AMENDED (joint re-confirm pending) |
| 0.5 USER GATE (PRD+Vision freeze, PRIL, spec-sanity) | PENDING |
| Vision GO gate | PENDING (needs explicit user GO) |
| 1..8 | BLOCKED until GO |

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
