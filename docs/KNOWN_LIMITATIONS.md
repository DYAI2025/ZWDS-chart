# Known Limitations

> **UPDATE — 2026-07-17 (post-slice-1).** Several rows below are STALE (written pre-build in a
> no-CLI sandbox). Now RESOLVED: **Lockfile/npm ci** (present, `npm ci` works), **Test/lint/E2E
> execution** (all run green locally + wired in `ci.yml`), **npm advisories** (high cleared via
> `vite@7.3.6`), **Live FuFirE** (real `/calculate` boundary PINNED — AMD-003 pin PASS, contract
> reconciled). Still genuinely OPEN: **Live geocoding** (unpinned; user supplied Google keys but no
> provider wired), **Reviewed hashes / Catalogue digest** (no named source-governance reviewer —
> OQ-003), **LLM** (slice-2, corpus SOURCE_NEEDED). Canonical current status:
> `docs/reality/bazodiac-zwds-atlas.evidence.jsonl` + `docs/traceability.md`.

| Item | Status | Why | Next step |
|---|---|---|---|
| npm aliases | `MISSING` | Direct manifest editing prohibited here. | Add documented aliases in an allowed environment. |
| Lockfile/npm ci | `BLOCKED` | Installer exposed no lockfile. | Generate/commit lockfile; run clean CI. |
| Live FuFirE | `UNVERIFIED` | No approved staging auth. | Configure staging and record non-PII smoke evidence. |
| Live geocoding | `UNVERIFIED` | Approved path absent. | Configure and contract-test it. |
| Reviewed hashes | verify-layer built, `SOURCE_NEEDED` (no attestation) | Source-governance elevation layer shipped (REQ-021): a hash-pinned reviewer attestation whose reviewedRulesetSha256 EXACTLY matches the live ruleset digest elevates the chart to SOURCE_REVIEWED (drops the not-authoritative notice); fails closed on any mismatch / blocked / mismatched-crosscheck (adversarial sweep: 0 confirmed authority bypasses). Ships with NO attestation → chart stays SOURCE_NEEDED / not-authoritative. | A NAMED reviewer must produce a genuine attestation (reviewer + the reviewed ruleset sha256 + provenance); never fabricate the hash or the sign-off. |
| LLM | pipeline built, `DISABLED` (no corpus) | Fail-closed synthesis pipeline shipped (REQ-015): gate refuses boot without a validated, hash-pinned reviewed corpus; grounding + numeric-containment guard rejects any ungrounded/predictive prose → deterministic fallback (adversarial sweep: 0 fail-closed violations). Residual limit: the guard is structural + numeric, NOT full semantic — non-numeric predictive prose still relies on the reviewed corpus + human output review. | Supply a genuinely source-reviewed corpus + sign-off, then enable and verify against the real LLM boundary. |
| PDF binary smoke | `RESOLVED` (2026-07-18) | Deployed URL served a 158 KB `application/pdf` (`%PDF`), CJK `官祿宮`/`太陽` + not-authoritative notice extracted. Runtime pinned via `Dockerfile` (node:22-slim + apt `chromium` + `fonts-noto-cjk`); Nixpacks `aptPkgs` did NOT provision it. | — |
| Test/lint/E2E execution | `BLOCKED` | CLI unavailable. | Run configured tools in CI/local shell. |
| npm advisories | `UNVERIFIED` details | Installer reports 1 high/1 low. | Audit each chain and apply compatible updates only. |
| Catalogue digest | content-pinned, reviewed `SOURCE_NEEDED` | Catalogue content digest computed + PINNED (`CATALOG_CONTENT_SHA256`) with a drift guard (a test recomputes it; silent catalogue drift fails the build). Fail-closed governance built: the catalogue is SOURCE_REVIEWED only when a reviewed pin (`CATALOG_SHA256`, null by default) exactly equals the content digest — surfaced on the report Method page. | A named reviewer sets `CATALOG_SHA256` to the reviewed content digest; never fabricated. |
| Guided views (Western adaptation) | **shipped** (2026-07-19), flag-guarded | Four flag-guarded product-translation layers over the same calculated report (`docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md`): Guided Summary (prominence rule `PALACE_PROMINENCE_PRODUCT_RULE_V1`, ADR), relationships, current life chapter, evidence-bound reflection. All `PRODUCT_TRANSLATION`/`REFLECTIVE_HYPOTHESIS`, evidence-bound, fail-closed, no calc changes. Green: tsc/eslint/arch/vitest(139)/build/e2e(desktop 13, mobile 8). | — |
| Guided user-test thresholds | `UNVERIFIED` (explorative until run) | The 4/5 comprehension thresholds need real moderated first-users (`ASSUMPTION` ≥5/sprint). Protocol template `docs/usertests/PROTOCOL_TEMPLATE.md`. Automated criteria all green; user-facing thresholds not yet measured. | Run ≥5 moderated tests per iteration; record in the protocol. |
| Prominence traditional-strength logic | `SOURCE_NEEDED` | No reviewed brightness/dignity logic exists, so "prominent" ships as a transparent `PRODUCT_TRANSLATION` (never "strongest"). Upgrade path in ADR: add a separate `TRADITIONAL_RULE` rule once approved; never mutate V1. | A source-governance reviewer approves a brightness/dignity ruleset. |
| Guided PDF layout | additive, open | Web/PDF terminology is consistent (shared `docs/language-guide.md`), but `server/pdf/renderPdf.mjs` still renders the traditional view; a Guided PDF layout is not wired. | Add a Guided print DOM behind the report-token pattern. |
| Reflection note persistence | `OFF` (blocked) | Iteration 4 saving is disabled (`guided.reflect.persistenceOff`) until a data-deletion/retention policy exists (`REQ-S-301`). Deterministic reflection + LLM stays disabled (corpus `SOURCE_NEEDED`). | Define a deletion/retention concept, then enable behind it. |