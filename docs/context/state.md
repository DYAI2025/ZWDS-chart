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

## PRIL enforcement wiring (2026-07-17)

The global Plumbline Stop hook (`plumbline-enforce.sh`, registered in `~/.claude/settings.json`)
fired: it requires the PRIL CLIs at `<repo>/config/claude/bin`, absent because this repo was never
`install.sh`'d. Fix:
- `config/claude/bin/plumbline-{context,scope,reality,...}-check` = local wrappers that pin
  `/usr/bin/python3` (bypassing the modern-python PATH shim) against the canonical Plumbline libs at
  `/Users/benjaminpoersch/Projects/_TOOLZ/plumbline_v1/Plumbline/config/claude/lib`.
- `config/` is gitignored (machine-specific abs paths; NOT product code). On another machine, run
  Plumbline `install.sh` to regenerate — the wrappers are a local dev artifact, not committed.
- Fixed real gate failures the CLIs caught: PRD/traceability lacked an accepted confirmation marker
  (`Confirmed by user: yes` added); Canvas scope heading had a parenthetical suffix + comma-joined
  bullets the parser couldn't read (renamed to `## Allowed change scope`, one clean glob per line).
- Gates verified PASS on the real surface: context-check exit 0, scope-check exit 0 (21 files).
- `.feature-boundary` intentionally NOT created yet → reality-check skipped until Gate C.

## Phase 1 complete (2026-07-17)

Run `wf_a6d18cef-73b` (tester + planner). Plan: `docs/plans/2026-07-17-bazodiac-zwds-atlas.md`.
11 tasks, 4 milestones, M=4 iterations. Iteration 1/4 (M1) = T01 (fix 3 CI eslint errors) + T02 (AMD-001 hard fail-closed).
Tester finding: AMD-002 "not authoritative" label is ABSENT from src/server today → T10.
Entering Phase 2 (coder/reviewer/security/Watcher loop).

## Iteration 1/4 — T01 DONE (2026-07-17)

T01 (REQ-018 CI unblock): fixed 3 eslint errors (AbortController server global; line-scoped no-undef for renderPdf browser-context `document`; `^_` unused-arg ignore for Express 4-arity `_next`) + a false-positive architecture-gate hit (comment literally contained `HUA_QUAN`; reworded — actual code uses canonical HUA_QU). Independent review (agent): no gate weakened; applied its Low fix (file-global document -> line-scoped disable).
Verified GREEN: eslint 0, tsc 0, arch-gates 0, vitest 41/41, build 0.
NOTE (latent, not fixed): architecture-gates.mjs regex scans raw content incl. comments -> any future doc naming a banned alias re-breaks CI. Intentionally NOT changed (the gate must also scan string literals; stripping comments risks exempting strings). Follow-up hardening candidate only.
Watcher (value): PASS — a RED CI gate means REQ-018 (reproducible validation) is unmet; green CI is the precondition for proving every other REQ. Aligned with CAN-003 traceability promise. No pause.
Next: T02 (AMD-001 hard fail-closed).

## Iteration 1/4 — T02 DONE (2026-07-17)

T02 (AMD-001 / REQ-019 hard fail-closed): normalize.mjs generateSections now THROWS ContractError('EVIDENCE_UNRESOLVED') on (1) unresolved evidence id, (2) section OR any cited evidence-entry sourceStatus==='BLOCKED', (3) crosscheck MISMATCH — replacing the HTTP-200 soft-drop. /interpret maps it to fail-closed 502 (+requestId, no partial); /calculate already short-circuits before storeReport (no token on refusal).
Per-increment chain (run wf_938bb32e-cc1): code-review PASS (mutation-checked — the test bites), security-review PASS (net improvement), Watcher CHANGES-REQUESTED (value-risk, NOT a Vision contradiction: "code may proceed; public value certification may not").
Applied reviewer strengthenings: per-entry BLOCKED check (heterogeneous-status gap); /interpret structural guard (malformed body -> 400 not 500); warnings-field comment; trailing newline. Added a 400-guard test.
Verified GREEN: vitest 45/45 (amd001 4/4), eslint 0, tsc 0, arch-gates 0.
Reality ledger docs/reality/bazodiac-zwds-atlas.evidence.jsonl created HONESTLY: all slice-1 evidence is integration-fake (real assembled BFF via supertest, fixture data). plumbline-reality-check PASSES at min-evidence integration-fake, FAILS at integration — the truthful RED. Real-boundary (integration+) needs the AMD-003 pin (T11, external creds). This is the user-accepted release-gated RED; NOT laundered, NOT self-downgraded.
Iteration 1/4 (M1) COMPLETE: T01 + T02 done.

## Iteration 2/4 — T03 DONE (2026-07-17)

T03 (component-test stage): vitest.config.ts now has two projects — `node` (existing 45 tests, include unchanged) + `component` (jsdom + @testing-library/react, tests/component/**/*.test.tsx). Real render smoke test tests/component/reportSmoke.test.tsx mounts the REAL AppProvider + real reducer (CALCULATION_SUCCESS with DEMO_REPORT) and renders the real StatusStrip — no mocks. Added devDeps: jsdom, @testing-library/{react,dom,jest-dom,user-event}. `npx vitest run` runs BOTH projects. Independent verification (orchestrator): vitest 46/46, eslint 0, tsc 0, arch-gates 0. Enables T04/T05/T06.

## Iteration 2/4 — T07 DONE (2026-07-17)

T07 (REQ-017): /api/report-pdf reordered so token lookup (404 REPORT_TOKEN_UNKNOWN) runs BEFORE the Chromium 503 check — expired/unknown-token rejection is now provable without a PDF runtime. New tests: tests/unit/reportStore.test.mjs (expiry eviction + prune reclaim + 192-bit token entropy) and tests/integration/pdf-token-expiry.test.mjs (2 cases red before the reorder). Updated bff.test.mjs (old 503-on-unknown-token assertion depended on the bug; now fetches a real token -> genuine 503, STRENGTHENED not weakened).
Review chain (wf_d4695e0c-06c): security PASS; code changes-requested (prune test was tautological — getReport's lazy eviction masked it). FIXED: added reportCount()/resetReports() test-only introspection; prune test now proves count 2->1 without reading the stale token, mutation-verified (no-op prune -> test fails). Surfaced a latent test-isolation bug (module-level records singleton not reset).
Verified GREEN: vitest 54/54, eslint 0, tsc 0, arch-gates 0. Reality: REQ-017 integration-fake (real assembled BFF, fixture data).
Iteration 2/4: T03 + T07 done; remaining T04 (REQ-011), T05 (REQ-012), T06 (REQ-016A).

## Iteration 2/4 — T04 code DONE, done-bar ESCALATED (2026-07-17)

T04 (REQ-011): schoolProfileStatus + scriptPolicy added to StatusStrip; new always-visible ReportProvenancePanel (all sub-views, self-owned .report-provenance styling) surfaces provenance origins + unresolved conventions on the MAIN report — directly mitigating RISK-001. All values from the real model, no fabrication. Reviewer polish applied: dedicated 'all conventions resolved' key, panel visibility no longer depends solely on the co-class, section aria-label covers both blocks.
Review (wf_3819c235-0ad): code PASS (mutation-verified — test bites 3 ways); WATCHER **BLOCK** — value genuinely advances CAN-003/RISK-001 (not hollow), BUT plumbline-reality-check --min-evidence integration fails (integration-fake), and per escalation-asymmetry the Watcher may NOT self-downgrade and an agent's GREEN report is NOT user consent. Watcher directive: keep the code, escalate the DONE-BAR to the user.
Verified GREEN: vitest 55/55, eslint 0, tsc 0, arch-gates 0, build 0. REQ-011 recorded integration-fake.
**PAUSED for user done-bar decision** (applies to ALL fixture-only slice-1 tasks, since every one is integration-fake until the AMD-003 real-boundary pin lands — which needs external staging creds). TRC-011 true-line-status stays value-risk until the user decides.

## AMD-003 real-boundary pin RAN — CONTRA-001 (2026-07-17)

User supplied real FuFirE staging creds. Auth determined empirically (x-api-key, no scheme; probe 200 vs 401). Ran scripts/amd003-pin.mjs against real https://api.fufire.space.
RESULT: DIVERGENCE (exit 3). Real /v1/calculate/zwds contract materially differs from the fabricated golden fixture — real transformation id HUA_QUAN (arch-gate BANS it), real 'catalog' object, stars ZUO_FU/WEN_QU, different normalized_input/palace structure, different ruleset-hash set. Current strict schema HARD-REJECTS real responses (FUFIRE_CONTRACT_MISMATCH); AMD-001 would refuse them. "12/20 green" was green against fiction.
CONTRA-001 recorded. Full report docs/reality/AMD-003-pin-2026-07-17.md. Escalated to user as a SCOPE SHIFT decision (reconcile contract to reality vs defer). Pinned real response at tests/fixtures/fufire/pinned-real/calculate.json (untracked pending decision). Security: creds in gitignored .env, never committed/logged; keys were exposed in chat -> user to rotate.
Iteration 2 remaining (T04 cert, T05, T06) HELD behind this decision.

## M-RECON: data-contract re-foundation (2026-07-17)

Analysis wf_3bf7513e-ca2 → R1-R15 plan (docs/plans/2026-07-17-CONTRA-001-reconciliation.md). Full contract re-foundation (~13 files; server/normalize.mjs rewritten). Re-scope: M=4 → 5 milestones; now at M-RECON (largest). DoD = real pin DIVERGENCE→PASS. Executed in 3 increments: RECON-server (R1-R7+server tests, atomic), RECON-client (R8-R14), RECON-verify (R15 + pin PASS). T05/T06 held behind this.

## RECON-server DONE + CONTRA-001 RESOLVED (calculate boundary) (2026-07-17)

RECON-server increment complete. Server data contract re-founded on the REAL FuFirE response. Review (wf_534afead-f89): code changes-requested (fixed: fail-OPEN in deriveCrosscheckStatus -> allowlist semantics; amd003-pin collect() dead field names -> palace_role_id + crosschecks[].status), Watcher changes-requested (reality ledger must record the real evidence -> DONE).
LIVE pin PASS (parseRawZwds+assertInvariants+normalizeRaw+generateSections all hold on real /v1/calculate/zwds; 29 sections, no over-refusal). Reality ledger: REQ-004 + REQ-005 -> real-boundary-smoke. plumbline-reality-check PASSES at min-evidence integration AND real-boundary-smoke.
CONTRA-001 RESOLVED for the calculate boundary. Geocode (REQ-002) stays integration-fake (not pinned; user has Google keys — separate provider design).
Gates: vitest 57 pass + 1 legit skip, eslint 0, tsc 0, arch-gates 0.
KNOWN residual (closes in RECON-client next): BFF↔FE transformation-id wire — server emits real HUA_QUAN but FE still speaks HUA_QU, so VITE_DATA_MODE=bff renders the Quan glyph as '?' until R8/R9. NOT claimed as bff-end-to-end-done.

## RECON-client DONE (2026-07-17)

FE reconciled to reality: zwdsTypes enums (HUA_QUAN; +ZUO_FU/+WEN_QU=18 stars), catalog entries added (左輔/文曲) + HUA_QU->HUA_QUAN, mockZwdsReport rebuilt from the REAL placement map (fixture-mode now matches bff-mode), PDF star hanzi ZUO_FU/WEN_QU, arch-gate UNIFIED (browser scan now also bans HUA_QU — FE migrated off it). New tests/component/transformationGlyph.test.tsx proves the BFF↔FE wire: HUA_QUAN resolves to 化權 (not '?'); mutation-verified (breaking the catalog id fails it). No standalone HUA_QU left in src (grep clean). Existing component tests unchanged + green.
Verified: vitest 58 pass + 1 skip, eslint 0, tsc 0, arch-gates 0. The BFF↔FE '?' gap from the RECON-server review is CLOSED.

## M-RECON COMPLETE (2026-07-17)

RECON-server + RECON-client + RECON-verify all done. Data contract re-founded on real FuFirE end-to-end (server + FE agree). DoD MET: live amd003-pin PASS; reality-check PASS at real-boundary-smoke; REQ-004/005 -> real-boundary-smoke + true-line true in the matrix. Gates: vitest 58/1skip, eslint/tsc/arch/build 0. CONTRA-001 resolved for the calculate boundary.
Remaining slice-1: T05 (REQ-012 natal-preservation), T06 (REQ-016A 44px) [M2 tail]; T08/T09 (M3 a11y+CI); T10 (M4 AMD-002 label). Geocode real-pin (REQ-002) still open (needs FUFIRE_GEOCODE_PATH or a Google provider — separate design).

## T05 DONE (2026-07-17)

T05 (REQ-012): natal-preservation locked (decade selection keeps report.palaces+stars byte-identical; mutation-verified the lock bites) + age-reckoning metadata surfaced (ageReckoningId from the real model, mock synced to real east_asian_nominal.guide-v1, +decade.ageReckoning locale key). Verified: vitest 61 pass + 1 skip, eslint 0, tsc 0, arch-gates 0. REQ-012 -> integration-fake.

## T06 DONE + M2 tail complete (2026-07-17)

T06 (REQ-016A 44px): added min-height:44px to .lang-switch__btn/.atlas-nav__link/.btn--small/.intake__step-indicator. tests/e2e/a11y-touch-targets.spec.ts measures boundingBox() in REAL chromium+webkit (desktop + mobile 360px) — red->green (33x22/36px -> >=44px). ALSO fixed 2 PRE-EXISTING e2e bugs in core-flow.spec.ts that would fail CI: (1) getByText(/privacy notice/i) strict-mode -> .intake__privacy summary; (2) getByRole('status') ambiguous (StatusStrip + aria-live announcer) -> {name:/report status/i}; (3) palace-grid nav gated to desktop (grid is <768px-hidden; mobile uses MobilePalaceNavigator, T08). Full e2e now 10/10 green both projects. REQ-016 -> real-boundary-smoke (44px; 200%/atlas pending T08).
NOTE for T09: ci.yml runs only --project=desktop-chromium + installs only chromium; mobile-chromium uses the iPhone-13 WebKit device -> T09 must add mobile project + `npx playwright install webkit`.
M2 tail (T05, T06) COMPLETE. Remaining: M3 (T08 a11y reality-ground, T09 CI wiring), M4 (T10 AMD-002 label).

## T08 DONE (2026-07-17) — M3 partial

T08 (REQ-016B a11y reality-ground): tests/e2e/atlas-a11y.spec.ts runs axe on the REPORT/atlas view at default AND 200% zoom (native document zoom, non-vacuous guard) + reduced motion, in real chromium+webkit; desktop-only grid features layout-gated (mobile via .mobile-navigator, not skipped-away). Real axe scan CAUGHT + FIXED a genuine contrast bug (black .hanzi palace glyph ~1.3:1 on dark) via new WCAG-AA --color-*-on-dark tokens (base palette untouched; wired in globals.css). Fixed the REQ-008 aria-live gap: AppShell now announces selection + harmony/opposition relations (extracted relatedPalaces to zwdsTypes, shared with PalaceWorkspace — DRY). No axe rules disabled/excluded. Full e2e 16/16 both projects. REQ-008 -> real-boundary-smoke; REQ-016 strengthened (200%/atlas real-verified).
Remaining: T09 (wire mobile-chromium + webkit install + component stage into ci.yml), T10 (AMD-002 label).

## T09 DONE (2026-07-17) — M3 complete

T09 (REQ-018 CI): ci.yml now installs chromium+webkit and runs `npx playwright test` (both desktop-chromium + mobile-WebKit projects) instead of desktop-only; component stage is the vitest jsdom project (already runs). Bumped vite 7.3.2->7.3.6 to clear a HIGH npm-audit advisory (server.fs.deny bypass + launch-editor NTLM, Windows) that would fail CI's `npm audit --audit-level=high`. FULL CI command list verified exit-0 locally on a real npm ci checkout (tsc/eslint/arch/vitest-both/build/playwright-both-16of16/audit). REQ-018 -> real-boundary-smoke (live Actions run would be production-verified).
M3 (T08, T09) COMPLETE. Remaining: M4 (T10 AMD-002 not-authoritative label). Geocode pin (REQ-002) + key rotation still open.

## T10 DONE (2026-07-17) — M4 complete, slice-1 build DONE

T10 (AMD-002): persistent "illustrative, unreviewed — not authoritative" notice on the MAIN report (all sub-views, role=note, normal flow) + the PDF, bilingual DE/EN. Condition derived from the real model (sourceStatus != SOURCE_REVIEWED) via reportIsSourceReviewed() — self-hiding once a reviewer signs, UNSPOOFABLE (no config flag can hide it while SOURCE_NEEDED). Tests red->green + reviewed-variant absence test; mutation-verified. Verified: vitest 65 pass + 1 skip, eslint 0, tsc 0, arch-gates 0.
SLICE-1 BUILD COMPLETE (all 5 milestones): M1 CI+fail-closed, M2 harness+partials, M-RECON real-contract, M3 a11y+CI, M4 AMD-002. AMD-001 (hard fail-closed) + AMD-002 (not-authoritative) done; AMD-003 pin PASS for the calculate boundary.
OPEN before release: geocode real-pin (REQ-002, needs FUFIRE_GEOCODE_PATH or Google provider); source-governance reviewer sign-off (AMD-002 releases the label); key rotation. Then Gate C/D + user acceptance.

## USER ACCEPTANCE — slice-1 accepted (2026-07-17)

Gate C PASS-WITH-RED + Gate D ACCEPT-WITH-NOTES (run wf_0f705a18-075); all actionable findings remediated (e2e flake fixed, ledger 18/18, stale docs corrected). USER ACCEPTED slice-1. /agileteam flow complete through Phase 7 (user acceptance). Phase 4 retro is human-gated in CORE (available via /reflect).
Slice-1 = 18 REQs delivered + honestly validated (16 pass, REQ-002 partial/geocode-unpinned, REQ-013/015 deferred slice-2). Reality-check passes at real-boundary-smoke; live FuFirE calculate pinned.
STANDING (user-owned, not slice-1 blockers): geocode real-pin (REQ-002), source-governance reviewer sign-off + catalog entry-status downgrade (AMD-002/OQ-003), AMD-003 n=1 robustness (pin 2-3 profiles + live Actions run), slice-2 (REQ-013 PDF, REQ-015 LLM), ROTATE the exposed FuFirE+Google keys, push/PR decision. .active-feature marker left armed (feature not fully done; enforcement stays live).

## Branch pushed + CI production-verified (2026-07-17)

Pre-push secret scan CLEAN (0 committed key hits; .env gitignored/never committed). Pushed agileteam/bazodiac-zwds-atlas -> origin. GitHub Actions run 29598629529 conclusion=SUCCESS (full pipeline incl. playwright chromium+webkit both projects). REQ-018 -> production-verified. STILL OPEN: rotate exposed keys; geocode pin; reviewer sign-off + catalog entry-status; AMD-003 n=1; slice-2 (REQ-013/015); PR merge decision.

## Deployed + LIVE verified (2026-07-17)

Railway single-service deploy live: BFF serves SPA + API. Deploy-verify caught FUFIRE_RULESET_METADATA_CONTRACT (real /v1/metadata endpoint returns release_status + human_review_required, which .strict() rejected — AMD-003 pin never hit the metadata endpoint). Fixed (2 optional fields). CONFIRMED on the deployed prod URL: live /api/zwds/calculate -> 200 SUCCESS/MATCHED, fresh requestId per call = real FuFirE end-to-end. main @ 2c634e0. REQ-004 -> production-verified.
Still open: geocode real-pin (REQ-002); source-governance reviewer + catalog entry-status; AMD-003 n=1; slice-2 (REQ-013/015); ROTATE keys.
