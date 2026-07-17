# PRD: BaZodiac Zi Wei Dou Shu Atlas

Status: FROZEN (Phase 0.7 spec-sanity PASS `wf_cc04fcd3-88f`; 5 refinements applied; final PRD freeze 2026-07-17)  
Confirmed by user: yes  
Feature Slug: bazodiac-zwds-atlas  
Owner: BaZodiac Product Team  
User Confirmation Required: yes  
Canvas + Vision: user-confirmed (with council amendments AMD-001..004) 2026-07-17 (Canvas: `docs/canvas/bazodiac-zwds-atlas.canvas.md`, Vision: `docs/vision/bazodiac-zwds-atlas.vision.md`)

## Source Summary

| Source ID | Source | Source Type | Use |
|---|---|---|---|
| SRC-001 | User request and project conversation | EXPLICIT | Product intent and Western-readable ZWDS goal |
| SRC-002 | Enterprise PRD | EXPLICIT | Requirements, risks, acceptance criteria and release boundaries |
| SRC-003 | Iterative implementation plan | EXPLICIT | Delivery sequence and technical slices |
| SRC-004 | Assumption audit | EXPLICIT | Corrections, failure modes and uncertainty |
| SRC-005 | FuFirE core-seed fixture | EXPLICIT | Current calculation contract and SOURCE_NEEDED status |

## Problem Statement

| Field | Value | Source Type | Source |
|---|---|---|---|
| Problem Statement | Western users cannot reliably interpret raw ZWDS palaces, stars, transformations and time windows, while an attractive but untraceable interpretation can create false confidence. | EXPLICIT | SRC-002 |

## Target Users

| ID | User | Source Type | Source |
|---|---|---|---|
| USER-001 | German- or English-speaking adult without prior ZWDS specialist knowledge | EXPLICIT | SRC-002 |
| USER-002 | Product or source reviewer validating evidence, ruleset status and release wording | EXPLICIT | SRC-002 |

## Goals

- Deliver a complete birth-input-to-report vertical slice through an Express BFF and FuFirE.
- Make the chart understandable through where, how, activation, connection and time.
- Bind explanations to evidence IDs, truth classes, ruleset metadata and visible source status.
- Produce equivalent DE/EN web and PDF reports without requiring an LLM.

## Non-Goals

- No browser-side calculation of palaces, stars, transformations, bureau or decades.
- No annual, monthly, daily or hourly overlays in Release 1.
- No BaZi-ZWDS fusion, HeHun or relationship matching in Release 1.
- No deterministic predictions, diagnoses or guarantees about fate, health, love, money or career.

## Assumptions

- ASSUMPTION: The current frontend prototype remains the implementation base and is hardened incrementally.
- ASSUMPTION: Release 1 uses one approved deterministic Chinese script policy; TW_TRADITIONAL is proposed but not yet confirmed.
- ASSUMPTION: The first technical slice is stateless except for short-lived PDF sessions.

## Open Questions

- MISSING: Is the first public release explicitly labeled Core Seed Preview, or held until a reviewed Sanhe-Sihua ruleset exists?
- MISSING: Will reports be persisted, and if so what authentication, tenant, retention and deletion model applies?
- MISSING: Which practitioner or source-governance reviewer approves the interpretation corpus and transformation table?
- MISSING: What latency, availability, traffic and PDF concurrency targets apply?

## Requirements

| Requirement ID | Requirement | Priority | Source Type | Source |
|---|---|---|---|---|
| REQ-001 | Guided birth intake collects local date, known time, direction method, optional flow direction, locale and script policy. | P0 | EXPLICIT | SRC-002 |
| REQ-002 | Calculation requires a backend-confirmed location with latitude, longitude, timezone and display label. | P0 | EXPLICIT | SRC-002 |
| REQ-003 | The browser communicates only with the Express BFF; FuFirE and LLM credentials remain server-side. | P0 | EXPLICIT | SRC-002 |
| REQ-004 | The BFF maps the browser DTO to the canonical FuFirE ZWDS request, checks ruleset metadata and validates the raw response against pinned contracts. | P0 | EXPLICIT | SRC-002 |
| REQ-005 | The normalizer preserves canonical FuFirE IDs, creates one source of truth for placements and enforces graph invariants. | P0 | EXPLICIT | SRC-002 |
| REQ-006 | The system builds an Evidence Index and truth-class metadata for ruleset, time, calendar, anchors, palaces, stars, transformations, relations, decades, quality and provenance. | P0 | EXPLICIT | SRC-002 |
| REQ-007 | The report renders exactly 12 unique palaces in a correct perimeter or equivalent ring with a readable central chart core. | P0 | EXPLICIT | SRC-002 |
| REQ-008 | Selecting a palace identifies focus, two harmony palaces and opposition and updates a keyboard-accessible inspector. | P0 | EXPLICIT | SRC-002 |
| REQ-009 | The report renders catalog Hanzi (glyph/policy-verified per EV-009 — NOT content-authoritative; content review is SOURCE_NEEDED and gated by AMD-002), tone-marked Pinyin, DE/EN labels and source status from a versioned catalog. | P0 | EXPLICIT | SRC-002 |
| REQ-010 | The base report provides deterministic explanations and remains complete when the LLM feature is disabled. | P0 | EXPLICIT | SRC-002 |
| REQ-011 | Calculation quality, ruleset, source status, unresolved conventions, provenance and chart fingerprint are visible in the main report. | P0 | EXPLICIT | SRC-002 |
| REQ-012 | When present upstream, 12 ten-year theme windows are displayed without overwriting the natal chart and with age-reckoning metadata preserved. | P1 | EXPLICIT | SRC-002 |
| REQ-013 | The server generates an A4 PDF from the same report model with real Chinese text, Pinyin, source status and chart fingerprint. | P1 | EXPLICIT | SRC-002 |
| REQ-014 | Fixture mode is immutable, visibly labeled DEMO_FIXTURE and cannot present arbitrary user input as calculated output. | P0 | EXPLICIT | SRC-002 |
| REQ-015 | Optional LLM synthesis receives only normalized evidence and approved content blocks and rejects unknown evidence or blocked claims. | P1 | EXPLICIT | SRC-002 |
| REQ-016 | The application is usable by keyboard, at 200 percent zoom, with reduced motion, 44px targets and responsive layouts from 360px to 1600px. | P0 | EXPLICIT | SRC-002 |
| REQ-017 | Birth data, coordinates and interpretation prompts are not written to application logs; PDF sessions are bounded and secrets remain server-only. | P0 | EXPLICIT | SRC-002 |
| REQ-018 | CI provides reproducible install, typecheck, build, unit, contract, component, accessibility, security and browser E2E validation. | P0 | EXPLICIT | SRC-002 |
| REQ-019 | Contract drift, metadata mismatch, graph inconsistency, unknown evidence and unsupported truth status fail closed with a stable request ID. | P0 | EXPLICIT | SRC-002 |
| REQ-020 | No production browser code calculates ZWDS, and no report makes deterministic claims about fate, health, love, money or career. | P0 | EXPLICIT | SRC-002 |

## Acceptance Criteria

| AC ID | Requirement ID | Given | When | Then | Source Type |
|---|---|---|---|---|---|
| AC-001 | REQ-001 | a user opens the intake | the user enters all required birth and display fields | the review step shows a complete, typed request or blocks submission with field-level errors | EXPLICIT |
| AC-002 | REQ-002 | a place query returns candidates | the user selects and confirms one candidate | latitude, longitude, timezone and display label are stored as confirmed and calculation becomes available | EXPLICIT |
| AC-003 | REQ-003 | the production frontend is inspected | network and static-code checks run | no direct FuFirE or LLM credential access exists in browser code | EXPLICIT |
| AC-004 | REQ-004 | a valid and an invalid FuFirE fixture are supplied | the BFF processes each response | the valid response passes and the invalid or mismatched response returns no partial report | EXPLICIT |
| AC-005 | REQ-005 | the golden fixture is normalized | graph validation runs | 12 unique palaces exist and all placement, transformation, relation and decade references resolve | EXPLICIT |
| AC-006 | REQ-006 | a normalized report is produced | the evidence index is generated | every interpretive block can reference stable existing evidence IDs and a truth class | EXPLICIT |
| AC-007 | REQ-007 | the golden fixture renders | the atlas layout is inspected | exactly 12 unique palaces occupy the perimeter and the central core remains readable | EXPLICIT |
| AC-008 | REQ-008 | a palace is selected by pointer or keyboard | selection changes | focus, two harmony palaces and opposition are visible and announced textually without losing keyboard focus | EXPLICIT |
| AC-009 | REQ-009 | DE and EN reports render | catalog and glyph checks run | expected Hanzi and tone-marked Pinyin appear from the versioned catalog without mixed script policy | EXPLICIT |
| AC-010 | REQ-010 | LLM configuration is absent | a valid chart is calculated | the full deterministic report and evidence view remain available (the PDF path is slice-2 per AMD-004 and is out of slice-1 AC scope) | EXPLICIT |
| AC-011 | REQ-011 | the upstream source status is SOURCE_NEEDED or school label is absent | the report renders | the limitation is visible in the main report and not only in a tooltip | EXPLICIT |
| AC-012 | REQ-012 | the response includes decadal windows | the user selects a window | the related palace is highlighted while natal placements remain unchanged | EXPLICIT |
| AC-013 | REQ-013 | a DE or EN report is available | server PDF generation completes | extracted PDF text contains language content, Chinese text, Pinyin, fingerprint and source status without clipping | EXPLICIT |
| AC-014 | REQ-014 | the app starts in fixture mode | a user views or attempts to alter the demo input | DEMO_FIXTURE remains visible and arbitrary input cannot masquerade as calculated output | EXPLICIT |
| AC-015 | REQ-015 | LLM output contains an unknown evidence ID or blocked deterministic claim | validation runs | the affected section is rejected and not displayed | EXPLICIT |
| AC-016 | REQ-016 | the report is used at 360px, 200 percent zoom and reduced-motion mode | a user navigates the atlas | one readable palace and its network remain operable without hover-only content | EXPLICIT |
| AC-017 | REQ-017 | calculation, failure and PDF flows execute | logs and requests are inspected | no raw birth PII or secrets appear in logs or LLM payloads and expired PDF tokens are rejected | EXPLICIT |
| AC-018 | REQ-018 | a clean checkout is validated | the documented CI commands run | install, typecheck, build and configured test suites pass with recorded output | EXPLICIT |
| AC-019 | REQ-019 | a schema, metadata, graph or evidence mismatch is injected | the request is processed | the system returns a stable fail-closed error with request ID and no partial report | EXPLICIT |
| AC-020 | REQ-020 | production bundles and report copy are reviewed | static and content audits run | no browser calculation implementation or deterministic outcome claim is present | EXPLICIT |

## Non-Functional Requirements

- Accessibility: keyboard, semantic structure, aria-live, 200 percent zoom, reduced motion and 44px touch targets.
- Reliability: fail closed on contract drift, ruleset mismatch, graph inconsistency, unsupported truth status or unknown evidence.
- Privacy: no birth date, birth time, coordinates, full place label or interpretation prompt in logs.
- Responsiveness: deliberate layouts at 360px, 768px, 1280px and 1600px.
- Reproducibility: pinned dependencies and documented clean-checkout validation.
- Claim safety: no unsupported traditional-completeness, scientific-validity or deterministic-outcome claims.

## Risks

| Risk ID | Risk | Mitigation | Source Type |
|---|---|---|---|
| RISK-001 | Polished UI hides SOURCE_NEEDED content | Persistent source status, truth classes and evidence view | EXPLICIT |
| RISK-002 | FuFirE contract drift corrupts reports | Pinned contracts, ruleset metadata checks and fail-closed validation | EXPLICIT |
| RISK-003 | LLM invents stars, evidence or claims | Optional feature, strict schema, evidence whitelist and rejection tests | EXPLICIT |
| RISK-004 | Birth data leaks through logs, prompts or PDF transport | BFF-only secrets, redaction, normalized evidence and bounded sessions | EXPLICIT |
| RISK-005 | Core seed is marketed as a complete school | Release wording gate and human source review | EXPLICIT |
| RISK-006 | Mobile atlas becomes unreadable | Palace navigator and one-palace-at-a-time mobile layout | EXPLICIT |
| RISK-007 | PDF renderer is unstable or resource-heavy | Concurrency limits, timeouts, smoke tests and feature flag | EXPLICIT |
| RISK-008 | LLM and future fusion delay the core product | Deterministic vertical slice first; defer optional scope | EXPLICIT |

## Evidence Needed

| Evidence ID | Requirement ID | Evidence Needed | Source Type |
|---|---|---|---|
| EV-001 | REQ-001 | Intake component test and browser E2E | EXPLICIT |
| EV-002 | REQ-002 | Geocoding contract and confirmation-state test | EXPLICIT |
| EV-003 | REQ-003 | Static bundle audit and network test | EXPLICIT |
| EV-004 | REQ-004 | Pinned schema, ruleset metadata and contract tests | EXPLICIT |
| EV-005 | REQ-005 | Normalizer invariant and property tests | EXPLICIT |
| EV-006 | REQ-006 | Evidence whitelist validation test | EXPLICIT |
| EV-007 | REQ-007 | Atlas topology component test | EXPLICIT |
| EV-008 | REQ-008 | Interaction, keyboard and aria-live test | EXPLICIT |
| EV-009 | REQ-009 | Catalog, Pinyin and glyph-policy audit | EXPLICIT |
| EV-010 | REQ-010 | LLM-disabled E2E test | EXPLICIT |
| EV-011 | REQ-011 | Source-status visibility test | EXPLICIT |
| EV-012 | REQ-012 | Timeline state and natal-preservation test | EXPLICIT |
| EV-013 | REQ-013 | PDF smoke, text extraction and clipping test | EXPLICIT |
| EV-014 | REQ-014 | Immutable demo-fixture test | EXPLICIT |
| EV-015 | REQ-015 | Adversarial interpretation validation test | EXPLICIT |
| EV-016 | REQ-016 | Accessibility and responsive browser test | EXPLICIT |
| EV-017 | REQ-017 | Log-redaction, secret-leak and token-expiry test | EXPLICIT |
| EV-018 | REQ-018 | CI validation log from clean checkout | EXPLICIT |
| EV-019 | REQ-019 | Negative schema and fail-closed integration fixtures | EXPLICIT |
| EV-020 | REQ-020 | Static calculation audit and content-safety review | EXPLICIT |

## Slice Plan & Council Amendments (adopted 2026-07-17)

Original Goal = all 20 REQs (status: NOT reduced). Iteration/slice scoping only:

| Slice | REQs | Note |
|---|---|---|
| **Slice 1** | REQ-001..012, 014, 016..020 (18 REQs) | Real-proven, hard-fail-closed, bilingual HTML evidence core. |
| **Slice 2** | REQ-013 (server PDF), REQ-015 (optional LLM) | Deferred per AMD-004. PDF needs real Chromium render + Pinyin; LLM needs a reviewed corpus (SOURCE_NEEDED). |

Council amendments (from confirmed Canvas AMD-001..004):

- **REQ-019 sharpened (AMD-001):** unknown / unsupported / unresolved evidence must **hard fail-closed
  (no partial report, no warning-only HTTP-200 pass)**. The current soft-drop (`SECTION_EVIDENCE_REJECTED`
  + HTTP 200) is a defect vs this requirement and is fixed early in slice-1.
- **Release-blocking gates (AMD-002, AMD-003):** (a) a named source-governance reviewer signs the catalog
  before any authoritative public claim; (b) at least one real FuFirE response is pinned before any public
  "traceable to real data" claim. Both are release gates, not slice-1 code blockers; the fixture-grounded
  build proceeds in parallel.
- **REQ-013 gap on record:** server PDF currently omits Pinyin and is never really rendered — carried into
  slice-2 scope.

## Links

- Vision: `docs/vision/bazodiac-zwds-atlas.vision.md`
- Canvas: `docs/canvas/bazodiac-zwds-atlas.canvas.md`
- Traceability: `docs/traceability.md`

## User Confirmation Required

Foundation (Canvas + Vision) user-confirmed 2026-07-17 via the AgileTeam confirmation gate ("Confirm as-is" + verbatim phrase below). This PRD is fully traceable to the confirmed Canvas/Vision. Per the Plumbline phase sequence, the PRD's **final freeze** happens at Phase 0.5 (USER GATE), after the Phase 0.16 council challenge gate and the Phase 0.7 spec-sanity audit, so that any council-adopted amendment is reflected before the spec is frozen.

> Ich bestaetige, dass Product Canvas und Product Vision meine Absicht korrekt wiedergeben und als Grundlage fuer AgileTeam Planning verwendet werden duerfen.
