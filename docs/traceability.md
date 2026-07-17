# Traceability Matrix

Feature Slug: bazodiac-zwds-atlas
Status: foundation-confirmed (Canvas + Vision user-confirmed 2026-07-17)

## Mandatory Canvas traceability fields (apply to ALL 20 top-level REQs)

Per the Plumbline Development entry condition, every top-level REQ carries all six Canvas
traceability fields. Five are constant for this single-feature slice and are stated once
here; the per-REQ `canvas-item` and `canvas-risk-status` vary and appear in the matrix.

- **canvas-link** — `docs/canvas/bazodiac-zwds-atlas.canvas.md`
- **canvas-problem** — CAN-001: raw ZWDS data/layouts are unreadable to Western users, and polished-but-untraceable interpretation is a trust risk.
- **canvas-target-user** — CAN-002: German- and English-speaking adults without specialist ZWDS knowledge (secondary: product/source-governance reviewers).
- **canvas-value-claim** — CAN-003: a readable symbolic map where every explanation stays traceable to FuFirE data, a versioned catalog and visible truth status.
- **canvas-success-signal** — CAN-009: the same pinned fixture produces the same normalized report + evidence IDs (fixture and mocked-remote), and the full journey completes with LLM disabled.
- **canvas-risk-status** — per REQ (see matrix): `aligned | value-risk | non-goal-violation | risk-introduced | blocked`.

## True-Line fields

- **vision-link** — per REQ (see `vision-item`), Vision doc `docs/vision/bazodiac-zwds-atlas.vision.md`.
- **value-check-id** — VCK-<nnn>, one per REQ.
- **true-line-status** — `true` (aligned) or `value-risk` (green/wired but reality-thin vs the confirmed value claim). No REQ is currently `pause`/`blocked`.

## Reality Ledger (evidence-class) — legend

`unit-fake` < `integration-fake` < `real-boundary-smoke` < `production-verified`; `n/a` = pure client, no external boundary.
Any I/O / remote / external-API / UI feature at `*-fake` is **RED regardless of green tests**.

## Matrix

| Trace | REQ | vision-item | canvas-item | AC | Evidence | wired-in-prod? | evidence-class | canvas-risk-status | value-check-id | true-line-status |
|---|---|---|---|---|---|---|---|---|---|---|
| TRC-001 | REQ-001 | VIS-001 | CAN-005 | AC-001 | EV-001 intake component + E2E | yes | n/a | aligned | VCK-001 | true |
| TRC-002 | REQ-002 | VIS-006 | CAN-005 | AC-002 | EV-002 geocode contract + confirm-state | yes | integration-fake | value-risk | VCK-002 | value-risk |
| TRC-003 | REQ-003 | VIS-004 | CAN-007 | AC-003 | EV-003 static bundle + network | yes | integration-fake | value-risk | VCK-003 | value-risk |
| TRC-004 | REQ-004 | VIS-005 | CAN-007 | AC-004 | EV-004 pinned schema + ruleset + contract | yes | integration-fake | value-risk | VCK-004 | value-risk |
| TRC-005 | REQ-005 | VIS-005 | CAN-010 | AC-005 | EV-005 normalizer invariant + property | yes | integration-fake | value-risk | VCK-005 | value-risk |
| TRC-006 | REQ-006 | VIS-004 | CAN-003 | AC-006 | EV-006 evidence whitelist validation | yes | integration-fake | value-risk | VCK-006 | value-risk |
| TRC-007 | REQ-007 | VIS-002 | CAN-005 | AC-007 | EV-007 atlas topology component | yes | real-boundary-smoke | aligned | VCK-007 | true |
| TRC-008 | REQ-008 | VIS-002 | CAN-005 | AC-008 | EV-008 interaction/keyboard/aria-live | yes | real-boundary-smoke | aligned | VCK-008 | true |
| TRC-009 | REQ-009 | VIS-004 | CAN-009 | AC-009 | EV-009 catalog/Pinyin/glyph audit | yes | n/a | aligned | VCK-009 | true |
| TRC-010 | REQ-010 | VIS-006 | CAN-009 | AC-010 | EV-010 LLM-disabled E2E | yes | n/a | aligned | VCK-010 | true |
| TRC-011 | REQ-011 | VIS-004 | CAN-007 | AC-011 | EV-011 source-status visibility | yes | integration-fake | value-risk | VCK-011 | value-risk |
| TRC-012 | REQ-012 | VIS-002 | CAN-005 | AC-012 | EV-012 timeline + natal-preservation | yes | integration-fake | value-risk | VCK-012 | value-risk |
| TRC-013 | REQ-013 | VIS-006 | CAN-005 | AC-013 | EV-013 PDF smoke + text extraction + clipping | yes | unit-fake | value-risk | VCK-013 | value-risk |
| TRC-014 | REQ-014 | VIS-007 | CAN-007 | AC-014 | EV-014 immutable demo-fixture | yes | integration-fake | aligned | VCK-014 | true |
| TRC-015 | REQ-015 | VIS-004 | CAN-008 | AC-015 | EV-015 adversarial interpretation validation | yes | unit-fake | aligned (deferred; LLM optional, corpus SOURCE_NEEDED) | VCK-015 | value-risk |
| TRC-016 | REQ-016 | VIS-001 | CAN-009 | AC-016 | EV-016 accessibility + responsive browser | yes | real-boundary-smoke | value-risk | VCK-016 | value-risk |
| TRC-017 | REQ-017 | VIS-004 | CAN-007 | AC-017 | EV-017 log-redaction + secret-leak + token-expiry | yes | integration-fake | value-risk | VCK-017 | value-risk |
| TRC-018 | REQ-018 | VIS-005 | CAN-010 | AC-018 | EV-018 CI validation from clean checkout | yes | real-boundary-smoke | value-risk | VCK-018 | value-risk |
| TRC-019 | REQ-019 | VIS-004 | CAN-008 | AC-019 | EV-019 negative schema + fail-closed fixtures | yes | integration-fake | value-risk | VCK-019 | value-risk |
| TRC-020 | REQ-020 | VIS-007 | CAN-006 | AC-020 | EV-020 static calc audit + content-safety | yes | real-boundary-smoke | aligned | VCK-020 | true |

## Coverage summary

- Requirements: 20 · linked to Vision: 20 · linked to Canvas: 20 · linked to AC: 20 · linked to Evidence: 20 · traceability gaps: 0.
- Implementation coverage (read-only audit `wf_898eb448-37f`): implemented 12, partial 8, missing 0.
- **Reality Ledger RED (fake-only on a boundary feature): 12/20** — REQ-002,003,004,005,006,011,012,013,014(aligned but integ-fake),015,017,019 sit at `integration-fake`/`unit-fake`, proven only against a self-authored golden fixture / mocks, never a real FuFirE or real-Chromium boundary. This is the dominant reality risk and is surfaced verbatim; only the user may reclassify it.
- **True-Line status:** 12 REQs `value-risk`, 8 `true`. No `pause`/`blocked`. The `value-risk` cluster reflects the same reality-thinness — green/wired but the confirmed value claim ("traceable to FuFirE data") is proven only against a fixture.

## Council amendments — slice + status deltas (adopted 2026-07-17)

Original Goal = all 20 REQs (NOT reduced). Iteration-1 = 18 REQs; REQ-013 + REQ-015 → slice-2.

| REQ | Slice | canvas-risk-status delta | true-line-status delta | Note |
|---|---|---|---|---|
| REQ-013 (PDF) | slice-2 | deferred-slice-2 | deferred | AMD-004; still owed by Original Goal. |
| REQ-015 (LLM) | slice-2 | deferred-slice-2 | deferred | AMD-004; corpus SOURCE_NEEDED. |
| REQ-019 (fail-closed) | slice-1 (early) | value-risk → will-fix-early | value-risk → target true | AMD-001: hard fail-closed, no warning-only pass. |
| all "traceable to real data" REQs | slice-1 | release-gated (AMD-002/003) | — | Public authoritative claim gated on reviewer sign-off + real-FuFirE pin. |

All other REQs: slice-1, unchanged from the matrix above.

## Notable semantic gaps (from audit, distinct from reality-thinness)

- **REQ-013** — server PDF omits Pinyin entirely; REQ text requires Pinyin. Real Chromium A4 render never exercised (no CI Chromium).
- **REQ-019** — unknown section evidence is soft-dropped (HTTP 200 + `SECTION_EVIDENCE_REJECTED` warning), not hard fail-closed; REQ text says unknown evidence fails closed.
- **REQ-015** — no LLM integration exists; only a deterministic unknown-evidence filter. Deferred while corpus is SOURCE_NEEDED (OQ-003).

## Confirmation

Foundation (Canvas + Vision) user-confirmed 2026-07-17. Final PRD freeze at Phase 0.5 after the council challenge gate and spec-sanity audit.
