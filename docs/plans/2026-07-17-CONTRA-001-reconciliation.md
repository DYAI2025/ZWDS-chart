# Reconciliation Plan — CONTRA-001 (real FuFirE contract re-foundation)

Feature: bazodiac-zwds-atlas · Branch: `agileteam/bazodiac-zwds-atlas` · User decision: SCOPE SHIFT **A** (reconcile to reality).
Source: analysis run `wf_3bf7513e-ca2` against the pinned real response `tests/fixtures/fufire/pinned-real/calculate.json`.
This is a **full data-contract re-foundation**, not a patch (~13 files; server/normalize.mjs rewritten).

## Re-scope (honest M update — no fake denominator)

Previously M=4 milestones. The reconciliation inserts a large new milestone. **New M=5:**

| Milestone | Status |
|---|---|
| M1 CI + hard fail-closed core (T01, T02) | ✅ done |
| M2 component harness + partials (T03, T07, T04 done; **T05, T06 pending**) | ▶ in progress, held behind RECON |
| **M-RECON data-contract re-foundation (R1–R15)** — the largest; DoD = real pin `DIVERGENCE → PASS` | ▶ **now** |
| M3 a11y reality-ground + CI (T08, T09) | queued |
| M4 AMD-002 not-authoritative label (T10) | queued |

M-RECON is by far the biggest chunk (server rewrite + client reconciliation + real-boundary verify). It converts the fixture-only RED toward real-boundary evidence.

## Real contract headline (vs the fabricated fixture)

- `normalized_input` flat → nested `{birth, calculation, output}`.
- palaces/placements key on **`palace_role_id`** (not `palace_id`); placements have **no** `provenance_ids`; add `family_id`/`scope`/`brightness_code`/`formula_id`.
- **18** stars (adds `ZUO_FU`, `WEN_QU`); transformation id **`HUA_QUAN`** (not `HUA_QU`).
- `chart` gains `transformations[]`, `completeness{}`, `coordinate_system`, `birth_cycle`; `five_elements_bureau` gains `phase_id`/`formula_id`/`source_status`.
- `resolution.chronometry`/`calendar` restructured (hour_branch_id + late_zi_applied move to chronometry; `pre_late_zi_lunar_date`; `year_label`+`month_length`).
- `quality`: `crosscheck_status` → `crosschecks[]` (status `MATCH`); no `human_review_required`; adds `unresolved_conventions[]`.
- `provenance`: `record_id`-shape → `provenance_id`-shape (+ `type`/`title`/`version`/`sha256`/`status` incl. `USER_PROVIDED`).
- top-level `catalog` key (null here — request had `include_catalog:false`).
- ruleset: real hex hashes for 5 policies; **omits** `leap_month`/`year_cycle`/`age_reckoning _sha256` (schema wrongly requires them). Heterogeneous source_status (MAJOR_14 SOURCE_REVIEWED, GUIDE_AUX_4 SOURCE_NEEDED; none BLOCKED; crosscheck MATCH → AMD-001 does NOT over-refuse).

## Tasks (R1–R15), grouped into 3 execution increments

**RECON-server (atomic — fixture + normalizer + server tests land green together):** R1 re-pin golden fixture from the real response · R2 re-pin ruleset metadata fixture · R3 rewrite `rawZwdsSchema` to the real shape · R4 fix server enums (STAR_IDS +ZUO_FU/+WEN_QU=18; TRANSFORMATION_IDS HUA_QU→HUA_QUAN) · R5 rewrite `normalizeRaw` to real field names · R6 fix `assertInvariants` · R7 reconcile `buildEvidenceIndex`/`generateSections` (heterogeneous source_status must NOT over-refuse) · server-side test updates (goldenFixture, bff, amd001, pdfHtml).

**RECON-client:** R8 client enums (zwdsTypes) · R9 reconcile hand-authored catalog IDs (keep bilingual; add ZUO_FU/WEN_QU; HUA_QU→HUA_QUAN) · R10 arch-gate banned list (drop HUA_QUAN, add HUA_QU) · R11 rebuild FE mock report from the real placement map · R12 PDF renderer hanzi maps · R13 amd003-pin STRICT mirror + collectors · client test updates (catalog, component).

**RECON-verify:** R15 run arch-gates + full vitest + the (now load-bearing) `tests/reality/fufire-pin.test.mjs`; re-run `node --env-file=.env scripts/amd003-pin.mjs` → require **PASS**. Only then do REQ-004/005 move to `real-boundary-smoke` in the Reality Ledger.

## Catalog + arch-gate decisions (from analysis)

- **Catalog:** keep `src/data/zwdsCatalog.ts` as the bilingual/label source of truth; do NOT adopt FuFirE's catalog (null here, unseen). Reconcile its ID set only. FuFirE = authoritative for chart FACTS; hand-authored = authoritative for PRESENTATION. Later: a drift-detector test once an `include_catalog=true` response is pinned.
- **Arch-gate:** the ONLY wrong ban is `HUA_QUAN` (the real id). Change `/\b(?:ZI_NV|PU_YI|HUA_QUAN|WU_STEM)\b/` → `/\b(?:ZI_NV|PU_YI|HUA_QU|WU_STEM)\b/`. Real uses `ZI_NU` (not ZI_NV), `JIAO_YOU` (PU_YI is only a catalog alias), plain `WU`; those bans stay valid.
