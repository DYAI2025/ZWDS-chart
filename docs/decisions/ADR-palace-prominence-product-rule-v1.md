# ADR — PALACE_PROMINENCE_PRODUCT_RULE_V1

- Status: **Accepted** (2026-07-19)
- Deciders: Product, ZWDS-Fachreview (pending sign-off), Frontend
- Context plan: `docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md` (§4, Iteration 1)
- Implementation: `src/domain/palaceProminence.ts`
- Related: `docs/language-guide.md`, `src/domain/truthTypes.ts`

## Context

Iteration 1 shows a new user "Deine prägendsten Paläste" — at most three life areas the chart
emphasises. This requires a rule that selects and orders those palaces. The traditional systems that
*could* justify a real strength ordering — star brightness (廟旺陷, miào/wàng/xiàn) and dignity —
are **not implemented** in the engine and **not source-reviewed** for this product
(`schoolProfileStatus === 'NOT_SELECTED'`, ruleset `SOURCE_NEEDED`; see `docs/traceability.md`).

Claiming a "strongest palace" ranking without that logic would fabricate authority: a user reads a
rank as a value judgement ("this area is best/worst"), which the plan's hard conditions forbid.

## Decision

Ship a transparent **product prioritisation**, never a traditional strength score. Name it
`PALACE_PROMINENCE_PRODUCT_RULE_V1` and classify every output it produces as `PRODUCT_TRANSLATION`
(not `TRADITIONAL_RULE`, not `CALCULATED_FACT`).

**Inputs — only already-calculated chart data (no new domain truth):**
1. **Major-star placements** — palaces holding one or more `MAJOR_STAR_IDS` placements.
2. **Calculated transformations** — palaces holding placements with non-empty `transformationTypes`.
3. **Direct relation to the Ming palace** — palaces in `OPPOSITION` or `SQUARE_HARMONY` with `MING`
   (via `relatedPalaces()`), plus `MING` itself.

**Scoring (transparent, documented, not traditional):** each signal a palace carries contributes to
a product score in the fixed priority order above (major stars weigh more than transformations, which
weigh more than a Ming relation). The score is an *ordering aid for presentation only* and is never
shown to the user as a number or a "strength".

**Selection:** take the top palaces by score, capped at **3**. The Ming palace is surfaced separately
as "Dein persönlicher Kern" and does **not** consume one of the three prominence slots.

**Tie handling (REQ-F-003):** palaces with an equal score are **equal**. The rule never invents a
tie-break to force a rank; tied palaces are returned in the chart's canonical `PALACE_IDS` order
(deterministic, byte-stable, explicitly *not* a strength order) and the UI presents them as
equivalent. If a tie at the cut line would push the count over 3, all tied members at that boundary
are dropped together rather than arbitrarily picking some — the UI shows fewer than 3 instead of a
fake ranking.

**Evidence binding (REQ-D-001):** every selected palace carries the `evidenceIds` of the exact
signals that selected it (e.g. `placement.natal:TAI_YANG`, `transformation.HUA_JI`,
`relation.MING.QIAN_YI`, `palace.MING`). No selection may exist without at least one resolvable
evidence id present in `report.evidenceIndex`; an unresolved id drops the palace (same fail-closed
discipline as `generateDemoSections`).

## Consequences

- **Honest:** the UI never claims a traditional authority it does not have. The output badge reads
  "Verständlich erklärt" (`PRODUCT_TRANSLATION`), and the "not authoritative" notice stays until a
  reviewer signs the source.
- **Reversible:** deleting `palaceProminence.ts` + its Guided view removes the feature without
  touching any calculation data. Feature-flagged (`featureFlags.guidedSummary`).
- **Upgrade path:** when a source-reviewed brightness/dignity logic is approved, add
  `PALACE_PROMINENCE_TRADITIONAL_RULE_V1` as a *separate* rule classified `TRADITIONAL_RULE`; do not
  mutate V1. V1's `PRODUCT_TRANSLATION` framing stays valid as the "plain-language" layer.
- **Determinism:** pure function of the normalized report; no `Date.now()`/random; identical for
  fixture-mode and bff-mode of the same chart (REQ-F-900).

## Alternatives rejected

- **"Strongest palaces" by brightness now** — rejected: brightness table not implemented/reviewed;
  would fabricate a traditional claim.
- **Arbitrary tie-break (e.g. by branch order presented as rank)** — rejected: reintroduces false
  ranking authority; violates REQ-F-003.
- **Show all 12 palaces ranked** — rejected: defeats the 90-second orientation goal (Iteration 1).
