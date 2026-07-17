# Product Canvas: BaZodiac Zi Wei Dou Shu Atlas

Status: user-confirmed
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

## User Confirmation

**Status: user-confirmed.**

- Confirmed by user: yes (ben.poersch@gmail.com)
- Confirmation date: 2026-07-17
- Method: AgileTeam confirmation gate — selected "Confirm as-is" and sent the verbatim phrase.
- Confirmation phrase (verbatim): "Ich bestaetige, dass Product Canvas und Product Vision meine Absicht korrekt wiedergeben und als Grundlage fuer AgileTeam Planning verwendet werden duerfen."

## Evidence note on AS-001 (implementation base)

AS-001 ("harden the existing prototype incrementally rather than replace it") was validated by a read-only repository audit before confirmation (workflow run `wf_898eb448-37f`, 5 agents, Opus): 12/20 REQs implemented, 8/20 partial, 0/20 missing. The assumption is therefore evidence-confirmed for planning. Caveat carried forward: 12/20 REQs are proven only against a self-authored golden fixture / mocks (Reality-Ledger `integration-fake` or `unit-fake`), never a real FuFirE or real-Chromium boundary — recorded as the dominant reality risk in `docs/traceability.md`.
