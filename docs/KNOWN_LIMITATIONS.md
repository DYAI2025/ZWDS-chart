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
| Reviewed hashes | `SOURCE_NEEDED` | Not supplied. | Retrieve from authoritative metadata; never fabricate. |
| LLM | `SOURCE_NEEDED` | No reviewed corpus. | Keep disabled until approved. |
| PDF binary smoke | `LOCAL_VERIFIED` / deploy pending | Local: real Chromium render proven (178 KB `%PDF`, CJK `官祿宮` extracted). Deploy: `nixpacks.toml` now installs apt `chromium` + `fonts-noto-cjk`. | Pull a PDF from the deployed URL to confirm the container runtime; then mark RESOLVED. |
| Test/lint/E2E execution | `BLOCKED` | CLI unavailable. | Run configured tools in CI/local shell. |
| npm advisories | `UNVERIFIED` details | Installer reports 1 high/1 low. | Audit each chain and apply compatible updates only. |
| Catalogue digest | `SOURCE_NEEDED` | Reviewed digest absent. | Review/pin canonical catalogue content digest. |