# Known Limitations

| Item | Status | Why | Next step |
|---|---|---|---|
| npm aliases | `MISSING` | Direct manifest editing prohibited here. | Add documented aliases in an allowed environment. |
| Lockfile/npm ci | `BLOCKED` | Installer exposed no lockfile. | Generate/commit lockfile; run clean CI. |
| Live FuFirE | `UNVERIFIED` | No approved staging auth. | Configure staging and record non-PII smoke evidence. |
| Live geocoding | `UNVERIFIED` | Approved path absent. | Configure and contract-test it. |
| Reviewed hashes | `SOURCE_NEEDED` | Not supplied. | Retrieve from authoritative metadata; never fabricate. |
| LLM | `SOURCE_NEEDED` | No reviewed corpus. | Keep disabled until approved. |
| PDF binary smoke | `EXTERNAL_RUNTIME_BLOCKER` | No executable Chromium/CJK runtime. | Run `%PDF`, size and extraction tests with runtime. |
| Test/lint/E2E execution | `BLOCKED` | CLI unavailable. | Run configured tools in CI/local shell. |
| npm advisories | `UNVERIFIED` details | Installer reports 1 high/1 low. | Audit each chain and apply compatible updates only. |
| Catalogue digest | `SOURCE_NEEDED` | Reviewed digest absent. | Review/pin canonical catalogue content digest. |