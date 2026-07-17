# Product Canvas: BaZodiac Zi Wei Dou Shu Atlas

Status: user-confirmed (re-confirmed with council amendments AMD-001..004 on 2026-07-17)
Feature Slug: bazodiac-zwds-atlas

| Section | ID | Value | Source Type | Source |
|---|---|---|---|---|
| Problem | CAN-001 | Raw ZWDS data and traditional chart layouts are difficult for Western users to understand, while polished but untraceable interpretation creates a trust risk. | EXPLICIT | SRC-002 |
| Users / Customers | CAN-002 | German- and English-speaking adults without specialist ZWDS knowledge; secondary users are product reviewers and source-governance reviewers. | EXPLICIT | SRC-002 |
| Value Promise | CAN-003 | A readable symbolic map of life areas, relations and time windows in which every explanation remains traceable to FuFirE data, a versioned catalog and visible truth status. | EXPLICIT | SRC-002 |
| Current Alternatives | CAN-004 | Raw JSON output, traditional specialist charts, generic astrology sites, or the current visual prototype without production data integration. | ASSUMPTION | SRC-002 |
| Key Capabilities | CAN-005 | Guided intake; confirmed geocoding; FuFirE calculation; contract validation; normalization; evidence index; interactive 12-palace atlas; deterministic DE/EN explanations; PDF; optional evidence-constrained LLM. | EXPLICIT | SRC-002 |
| Non-Goals | CAN-006 | No browser-side ZWDS calculation, no deterministic fortune or health claims, no dynamic overlays, no BaZi fusion and no account history in the first technical slice. | EXPLICIT | SRC-002 |
| Constraints | CAN-007 | FuFirE is the calculation authority; browser accesses only the BFF; unsupported data fails closed; core-seed limitations remain visible; Chinese text comes from a versioned deterministic catalog. | EXPLICIT | SRC-002 |
| Risks | CAN-008 | Contract drift, interpretation hallucination, privacy leakage, source-governance ambiguity, unreadable mobile layout, PDF resource use and overengineering. | EXPLICIT | SRC-002 |
| Success Signal | CAN-009 | The same pinned fixture produces the same normalized report and evidence IDs in fixture and mocked-remote paths, and the user can complete the full report journey with LLM disabled. | EXPLICIT | SRC-002 |
| Evidence | CAN-010 | FuFirE request/response schemas, golden fixtures, ruleset metadata, normalizer invariants, evidence IDs, UI tests, PDF text extraction and release review. | EXPLICIT | SRC-002 |
| Allowed Scope | CAN-011 | Contract-first implementation through a stateless technical report slice, including BFF, normalized model, atlas, deterministic explanations, source view and bounded PDF sessions. | EXPLICIT | SRC-003 |
| Unresolved Questions | CAN-012 | Whether public Release 1 is a Core Seed Preview or waits for reviewed Sanhe-Sihua; whether reports persist; auth/tenant model; reviewer authority; SLOs. | MISSING | SRC-002 |

## Allowed change scope (PRIL Scope Guard)

Repo-relative paths in scope for the confirmed contract-first slice (CAN-011). Edits outside this set require explicit user scope expansion.

- `src/**` (frontend report client)
- `server/**` (Express BFF, normalizer, FuFirE/geocode clients, report store, PDF)
- `tests/**` (unit, integration, e2e, fixtures)
- `scripts/architecture-gates.mjs`, `eslint.config.js`, `.github/workflows/**`
- `package.json`, config files (`*.config.ts`, `tsconfig.json`)
- `docs/**` (governance + engineering docs)

## Council Amendments (Phase 0.16, adopted by user 2026-07-17 — pending re-confirm)

The three-role council challenge gate (run `wf_b440a0e9-841`) produced five legitimate-blocker
findings; the user adopted all four steer options. These amend the confirmed Canvas above:

- **AMD-001 — Hard fail-closed (augments CAN-007 Constraints).** Unknown / unsupported / unresolved
  evidence fails closed as a **hard refusal** (no partial report, no warning-only HTTP-200 pass).
  Fixing REQ-019's current soft-drop is pulled to the front of the build. This is the single guard on
  the no-fabrication promise (CAN-003).
- **AMD-002 — Source-governance release gate (augments CAN-006 Non-Goals + CAN-008 Risks).** Until the
  interpretation catalog is externally signed by a named source-governance reviewer, public output is
  **labelled "illustrative, unreviewed — not authoritative"** or gated to reviewers only. A named
  source-governance reviewer (OQ-003) becomes a **release-blocking role**. Resolves RISK-005 into a hard gate.
- **AMD-003 — Real-FuFirE pin release gate (augments CAN-009 Success Signal + CAN-010 Evidence).** No
  public "traceable to real data" claim ships until **at least one real FuFirE response is pinned** and
  matches the golden fixture's shape. Blocked today by missing staging credentials; the fixture-grounded
  build proceeds in parallel, but the public trust claim is gated on this.
- **AMD-004 — Narrow slice-1 (amends CAN-011 Allowed Scope).** Iteration-1 scope excludes **REQ-013 (server
  PDF)** and **REQ-015 (optional LLM)**; slice-1 ships the real-proven, hard-fail-closed, bilingual HTML
  evidence core. PDF + LLM defer to **slice-2**.
  **Scope-shift note:** Original Goal = all 20 REQs, status **NOT reduced**. Only the iteration-1 scope
  shrinks to 18 REQs (REQ-013, REQ-015 deferred), tracked separately in `docs/traceability.md`.

### Release-blocking gates (from amendments)

1. Hard fail-closed on unknown evidence (AMD-001) — engineering gate, in slice-1.
2. Named source-governance reviewer signs the catalog before any authoritative public claim (AMD-002).
3. One real FuFirE response pinned before any public "traceable to real data" claim (AMD-003).

## User Confirmation

**Status: user-confirmed (with amendments AMD-001..004).**

- Confirmed by user: yes (ben.poersch@gmail.com)
- Foundation confirmation: 2026-07-17, "Confirm as-is" + verbatim phrase.
- Re-confirmation (with council amendments): 2026-07-17, user selected "Re-confirm as amended" at the Phase 0.16 steer gate.
- No agent self-confirmed at any point.
- Confirmation phrase (verbatim): "Ich bestaetige, dass Product Canvas und Product Vision meine Absicht korrekt wiedergeben und als Grundlage fuer AgileTeam Planning verwendet werden duerfen."

## Evidence note on AS-001 (implementation base)

AS-001 ("harden the existing prototype incrementally rather than replace it") was validated by a read-only repository audit before confirmation (workflow run `wf_898eb448-37f`, 5 agents, Opus): 12/20 REQs implemented, 8/20 partial, 0/20 missing. The assumption is therefore evidence-confirmed for planning. Caveat carried forward: 12/20 REQs are proven only against a self-authored golden fixture / mocks (Reality-Ledger `integration-fake` or `unit-fake`), never a real FuFirE or real-Chromium boundary — recorded as the dominant reality risk in `docs/traceability.md`.
