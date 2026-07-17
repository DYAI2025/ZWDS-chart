# Product Vision: BaZodiac Zi Wei Dou Shu Atlas

Status: draft (joint re-confirm pending with Canvas after Phase 0.16 council amendments)
Feature Slug: bazodiac-zwds-atlas
Confirmation Status: re-confirmation-pending
Canvas: `docs/canvas/bazodiac-zwds-atlas.canvas.md`

> **Council amendment note (2026-07-17):** VIS-005/VIS-006 slice-1 scope now excludes REQ-013 (PDF) and
> REQ-015 (LLM) per Canvas AMD-004 (deferred to slice-2). Original Goal (all 20 REQs) is NOT reduced.
> Public "traceable to real data" claims are gated on a real-FuFirE pin (AMD-003) and source-governance
> reviewer sign-off (AMD-002). The Vision statement itself is unchanged; re-confirm covers Canvas + Vision jointly.

## Product Vision Statement

For German- and English-speaking adults who want to understand Zi Wei Dou Shu without prior specialist knowledge, the BaZodiac ZWDS Atlas is a web-based report product that turns FuFirE-calculated chart data into a Western-readable, bilingual and evidence-traceable map of life areas, relations and time windows. Unlike raw JSON, specialist-only charts or generic untraceable astrology text, it preserves source status, provenance and original terminology while refusing unsupported deterministic claims.

## Product Vision Board

| Area | ID | Value | Source Type | Source | User Decision Needed |
|---|---|---|---|---|---|
| Target Group | VIS-001 | German- and English-speaking adults who want to understand a ZWDS chart without prior specialist knowledge. | EXPLICIT | SRC-002 | no |
| User Needs | VIS-002 | Users need a readable explanation of palaces, stars, transformations, relations and time windows, with visible evidence and uncertainty. | EXPLICIT | SRC-002 | no |
| Product / Feature | VIS-003 | BaZodiac Zi Wei Dou Shu Atlas: a web report client that obtains computed chart data from FuFirE and renders an interactive bilingual report. | EXPLICIT | SRC-002 | no |
| Product Value | VIS-004 | Translate a traditionally dense chart into a Western-readable structure without hiding original terminology, source status or calculation provenance. | EXPLICIT | SRC-002 | no |
| Project Goals | VIS-005 | Deliver a contract-first vertical slice from birth intake through BFF, FuFirE, normalization, atlas, evidence and PDF. | EXPLICIT | SRC-002 | no |
| Success Signals | VIS-006 | A user can complete intake, receive exactly 12 palaces, explore relations, read deterministic DE/EN explanations, inspect evidence and export an equivalent PDF without requiring an LLM. | EXPLICIT | SRC-002 | no |
| Boundaries | VIS-007 | Release 1 excludes dynamic annual/monthly/daily/hourly overlays, BaZi-ZWDS fusion, HeHun and deterministic predictions. | EXPLICIT | SRC-002 | no |
| Assumptions | VIS-008 | The existing frontend prototype is hardened incrementally rather than replaced. | EXPLICIT (evidence-confirmed, run wf_898eb448-37f) | SRC-004 | resolved |
| Missing Items | VIS-009 | Public release positioning, persistence/authentication model, practitioner reviewer and production SLOs remain unresolved (tracked OQ-001..004). | MISSING | SRC-002 | yes |

## Confirmation

**Status: re-confirmation-pending (joint with Canvas, after Phase 0.16 council amendments).**

- Prior confirmation (foundation): user, 2026-07-17, "Confirm as-is" + verbatim phrase — valid for the
  un-amended Vision statement/board.
- Council amendments AMD-001..004 (Canvas) touch slice scope + release gates; re-confirm covers Canvas + Vision jointly.
- Method: AgileTeam confirmation gate — "Confirm as-is" + verbatim confirmation phrase.
- Confirmation phrase (verbatim): "Ich bestaetige, dass Product Canvas und Product Vision meine Absicht korrekt wiedergeben und als Grundlage fuer AgileTeam Planning verwendet werden duerfen."

Note: VIS-008 was upgraded from ASSUMPTION to evidence-confirmed by the pre-confirmation read-only audit (12/20 implemented, 8/20 partial, 0 missing). VIS-009 items remain open (OQ-001..004) and are resolved at their natural decision points, not silently.
