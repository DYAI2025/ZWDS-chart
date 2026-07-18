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
| Catalogue digest | `SOURCE_NEEDED` | Reviewed digest absent. | Review/pin canonical catalogue content digest. |