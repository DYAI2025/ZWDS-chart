# Plan — BaZodiac ZWDS Atlas (slice-1 hardening)

Feature: bazodiac-zwds-atlas · Branch: `agileteam/bazodiac-zwds-atlas` · Mode: CORE · Model: Opus 4.8
Source: Phase 1 (tester + planner), run `wf_a6d18cef-73b`. Slice-1 = 18 REQs (REQ-013 PDF + REQ-015 LLM → slice-2).
This is a **hardening** job: green REQs (001–010, 014, 020) get no re-impl; work = partials + AMD amendments.

## Iterations (M = 4, derived honestly from 4 shippable increments — not rounded)

| Iter | Milestone | Tasks |
|---|---|---|
| 1/4 | M1 Green CI gate + hard fail-closed safety core | T01, T02 |
| 2/4 | M2 Close slice-1 partials on a real component harness | T03, T04, T05, T06, T07 |
| 3/4 | M3 Reality-ground a11y in a real browser + widen CI | T08, T09 |
| 4/4 | M4 Release-gate scaffolds (AMD-002 label, AMD-003 pin) | T10, T11 |

## Tasks

| ID | Title | REQ | Type | Size | Depends |
|---|---|---|---|---|---|
| T01 | Fix 3 pre-existing CI eslint errors (server globals `AbortController` @fufireClient.mjs:20 + `document` @renderPdf.mjs:52; unused `_next` @index.mjs:188) so `npx eslint .` exits 0 | REQ-018 | ci-fix | S | — |
| T02 | **AMD-001 hard fail-closed** (FIRST impl): replace `normalize.mjs` soft-drop (`SECTION_EVIDENCE_REJECTED` + HTTP 200 partial) with a thrown `ContractError('EVIDENCE_UNRESOLVED')`; `/calculate` + `/interpret` map it to a fail-closed 502 + requestId, NO partial report. Also fail-closed on unsupported truth status (source_status=BLOCKED / crosscheck=MISMATCH). | REQ-019 | test-first-impl | M | T01 |
| T03 | Add a jsdom/RTL vitest component stage (separate from the node suite) + one render smoke test | REQ-018 | reality-ground | M | T01 |
| T04 | Close REQ-011: surface provenance + schoolProfileStatus + scriptPolicy + source status in the MAIN report body (not only the Evidence tab) | REQ-011 | test-first-impl | M | T03 |
| T05 | Close REQ-012: decade selection highlights palace while natal placements stay byte-stable; age-reckoning metadata rendered | REQ-012 | test-first-impl | M | T03 |
| T06 | Close REQ-016A: enforce 44px min touch targets on lang-switch / nav / small buttons | REQ-016 | test-first-impl | M | T03 |
| T07 | Close REQ-017: expired-PDF-token rejection test + reportStore prune/expiry test (reorder token check ahead of the Puppeteer 503 so expiry is provable without Chromium) | REQ-017 | test-first-impl | S | T01 |
| T08 | Reality-ground REQ-016B: real-browser a11y at 200% zoom / 360px / full atlas keyboard+aria-live, desktop AND mobile chromium | REQ-016 | reality-ground | M | T06 |
| T09 | Wire mobile-chromium + component stage into `ci.yml` (mobile project exists but CI runs desktop only) | REQ-018, REQ-016 | ci-fix | S | T03, T08 |
| T10 | **AMD-002** gate-scaffold: "illustrative, unreviewed — not authoritative" labelling surface on all public output + config `catalogReviewStatus` (unreviewed until a named reviewer signs). **Tester confirmed this label is absent from the codebase today.** | REQ-009, 011, 020 | gate-scaffold | M | T04 |
| T11 | **AMD-003** gate-scaffold: real-boundary pin/reconcile harness for a pinned real FuFirE **and** geocode response vs the fixture/normalizer contract; ships PENDING until real creds exist (external). Ordered after T02 (AMD-001×AMD-003 coupling: reconcile before flipping the public claim). | REQ-002, 004, 005 | reality-ground | L | T02 |

## AMD-001 falsifying test (T02, red today → green after fix)

`tests/integration/amd001-unknown-evidence.test.mjs` (supertest vs `createApp`, fixture mode). Build the golden normalized report via `normalizeRaw(fixture)`, delete one evidence entry a generated section references (e.g. `anchor.ming`), POST to `/api/zwds/interpret`. Assert: status ≠ 200 (fail-closed 502/422); `error.code === 'EVIDENCE_UNRESOLVED'`; `error.requestId` == `x-request-id` header; `body.sections`/`body.report` undefined; NO `SECTION_EVIDENCE_REJECTED` warning. **Negative control (must stay green):** intact golden report still returns 200 with sections — the fix must not over-refuse (AMD-001×AMD-003 sequencing caution).

## Per-REQ new tests (from tester)

Unit/pure (no reality flag owed): REQ-005 (per-branch invariant codes + roundtrip property), REQ-006 (evidence-index completeness + truth-class), REQ-009 (bilingual no-mixed-script), REQ-020 (content-safety regex over de.ts/en.ts). Boundary (reality-killing test owed): REQ-001 (validate/toBirthInput unit + blocked-submission E2E), REQ-002/004 (contract negatives + AMD-003 pin harness), REQ-003 (built-`dist` secret grep + full-flow network isolation), REQ-007/008 (component render + keyboard/aria-live E2E), REQ-011/012/016 (main-report visibility, natal-preservation, 44px/200%/360px), REQ-014 (fixture immutability + demo-deviation), REQ-017 (real-stdout redaction + token expiry), REQ-018 (clean-checkout CI green), REQ-019 (5-category fail-closed).

## Reality Ledger (unchanged, surfaced not downgraded)

REQ-002 (geocode) + REQ-004 (FuFirE) fake-only RED clears ONLY via the AMD-003 pin harness (T11), which needs external staging creds → those tests ship skippable-until-pinned and stay RED. Only the user reclassifies.
