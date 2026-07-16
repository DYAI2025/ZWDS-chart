# BaZodiac — Zi Wei Dou Shu Atlas

Evidence-bound React 19 report client plus Express 5 BFF for FuFirE Zi Wei Dou Shu charts. The browser performs no ZWDS calculation and never receives FuFirE raw data or server credentials.

## Current implementation

- Fixture and BFF provider modes with an explicitly labelled demo profile.
- Canonical `zwds.raw.v1` validator using `chart.star_placements[]` as the only placement truth.
- Fail-closed palace, branch, placement, transformation, decade and ruleset-metadata invariants.
- Normalized `fufire.zwds-evidence.v1` report, provenance, warnings, derivation trace and Evidence Index.
- Deterministic, non-predictive explanation rules; LLM disabled while the reviewed corpus is `SOURCE_NEEDED`.
- Express security boundary, live FuFirE adapter, isolated geocoding providers and configurable Puppeteer PDF renderer.
- React application split into intake, atlas, report, evidence, navigation, hero and common modules.
- Playwright, axe, Vitest, ESLint, architecture-gate and CI definitions.

## Available repository scripts

The supplied package manifest currently exposes only `npm run dev`, `npm run build` and `npm run preview`. Verification tools are installed and can be invoked directly:

```bash
npx tsc --noEmit
npx eslint .
node scripts/architecture-gates.mjs
npx vitest run
npx vitest run tests/unit
npx vitest run tests/integration
npx playwright test
npx playwright test --grep @a11y
node server/index.mjs
```

Adding the requested npm aliases requires an allowed package-manifest update. This execution environment did not permit direct `package.json` edits, so the missing aliases remain transparently documented rather than falsely claimed.

## Modes

`VITE_DATA_MODE=fixture` uses the bundled, visibly labelled Shanghai demo bundle. Changes to the prefilled birth profile are not recalculated. `VITE_DATA_MODE=bff` sends only the browser DTO to the same-origin Express BFF.

`FUFIRE_MODE=fixture` validates and normalizes the canonical golden fixture server-side. `FUFIRE_MODE=live` requires an approved base URL, authentication header, authentication scheme where applicable, API key and optional geocoding path. The live boundary is implemented but `UNVERIFIED` without staging credentials.

Copy `.env.example` and keep all FuFirE values server-side. The client bundle must never contain them.

## PDF

The BFF stores report bundles behind an unguessable, expiring report token. `POST /api/report-pdf` resolves that token and uses `puppeteer-core` with `PUPPETEER_EXECUTABLE_PATH`. Without Chromium it returns `PDF_RUNTIME_UNAVAILABLE`. Browser print remains a fallback.

## Verification

See `docs/BASELINE.md`, `docs/VERIFICATION.md` and `docs/KNOWN_LIMITATIONS.md`. Only the Vite production build was executable through the provided runtime tool. Other checks are configured but not claimed as passed here.

## Source disclaimer

The bundled core-seed fixture reports `SOURCE_NEEDED`, missing reviewed hashes and required human review. It is not presented as a complete traditional school. Empty palaces remain empty; no stars, transformations or outcomes are invented.# ZWDS-chart
