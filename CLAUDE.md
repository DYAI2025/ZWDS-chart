# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BaZodiac — evidence-bound React 19 report client + Express 5 BFF for FuFirE Zi Wei Dou Shu (ZWDS) astrology charts. The browser never calculates ZWDS itself and never sees FuFirE raw data or server credentials; all calculation/normalization happens server-side and crosses the wire only as a validated, normalized report.

## Commands

`package.json` only defines `dev`/`build`/`preview`. Everything else is invoked directly (this is intentional — see `docs/KNOWN_LIMITATIONS.md`, and `.github/workflows/ci.yml` for the canonical sequence):

```bash
npm run dev                          # Vite dev server
npm run build                        # production build
npx tsc --noEmit                     # typecheck
npx eslint .                         # lint (includes architecture-boundary rule)
node scripts/architecture-gates.mjs  # custom browser/server boundary + secret-leak gate
npx vitest run                       # all unit + integration tests
npx vitest run tests/unit            # unit only
npx vitest run tests/integration     # BFF integration only
npx playwright test                  # e2e (spins up vite preview on :4173 via webServer)
npx playwright test --grep @a11y     # axe accessibility subset
node server/index.mjs                # run the BFF standalone (uses same env as .env.example)
```

Single test file: `npx vitest run tests/unit/palaceGrid.test.ts`. Single Playwright spec: `npx playwright test tests/e2e/core-flow.spec.ts`.

CI (`.github/workflows/ci.yml`) runs, in order: `npm ci` → `tsc --noEmit` → `eslint .` → `architecture-gates.mjs` → `vitest run` → `build` → `playwright test --project=desktop-chromium` → `npm audit --audit-level=high`. Match this order when verifying a change end-to-end.

## Architecture

```
React components -> AppContext/reducer -> ZwdsDataProvider
  -> NormalizedZwdsReport + local catalogue only

BffZwdsProvider -> same-origin /api
MockZwdsProvider -> normalized demo bundle only

Express BFF -> FuFirE client / GeocodeProvider -> strict raw contract
  -> fail-closed invariants -> normalizer -> Evidence Index/rules
  -> expiring report store -> PDF renderer
```

- **`src/app/providerFactory.ts`** picks `MockZwdsProvider` (fixture) or `BffZwdsProvider` based on `VITE_DATA_MODE`. `src/App.tsx` is intentionally two lines — just `AppProvider` + `AppShell`; all logic lives under `src/app`, `src/components/*`, `src/services`, `src/domain`.
- **Hard boundary**: browser code must never import from `server/`, reference `FUFIRE_API_KEY`/`FUFIRE_BASE_URL`/`FUFIRE_AUTH`, or contain literal FuFirE endpoint paths (`/v1/calculate/zwds`, `metadata/zwds/rulesets`). Enforced by both an ESLint `no-restricted-imports` rule (`eslint.config.js`) and `scripts/architecture-gates.mjs`, which also blocks a list of non-canonical alias star IDs (`ZI_NV`, `PU_YI`, `HUA_QUAN`, `WU_STEM`) and scans `server/**/*.mjs` for PII in log calls. Run the gate script after touching anything under `src/` or `server/`.
- **Data contract** (`server/normalize.mjs`, see `docs/data-contract.md`): `chart.star_placements[]` is the *only* source of truth for star placement. Palaces store `placement_ids[]` and the UI resolves by ID — never invent or reorder placements. Transformations are copied only from a concrete placement's `transformation_types[]` and retain that `placementId`. Parsing is strict: unknown IDs/statuses/fields fail closed, all 12 roles/branches are required, decades must be input-sorted/contiguous/non-overlapping.
- **Evidence model** (`docs/evidence-model.md`): every deterministic report section carries rule ID/version, truth class, source status, evidence IDs, localization key, limitations. Unknown evidence rejects the whole section (`SECTION_EVIDENCE_REJECTED`) rather than rendering partial/guessed content.
- **LLM synthesis is disabled** (`LLM_ENABLED=false`, enforced by zod env validation in `server/index.mjs`) until a reviewed rules corpus exists (`LLM_CORPUS_STATUS=SOURCE_NEEDED`). Don't wire up LLM-based interpretation without updating that gate — it's a deliberate fail-closed default, not a TODO.
- **`server/index.mjs`** is the whole BFF surface: `/api/status`, `/api/config-status`, `/api/geocode`, `/api/zwds/calculate`, `/api/zwds/interpret`, `/api/zwds/ruleset-status`, `/api/report-pdf`. Config is a single zod schema (`envSchema`) with `superRefine` cross-field rules (e.g. `PORT=0` only allowed in test mode; live FuFirE mode requires base URL/key/auth header; LLM can't be enabled while corpus is unreviewed). `FUFIRE_MODE=fixture` serves `tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json` and rejects any birth input that doesn't match it (`FIXTURE_PROFILE_MISMATCH`, see `assertFixtureCompatible`) — you cannot use the fixture backend to test arbitrary charts, only the bundled Shanghai 1984 demo profile.
- **PDF**: report bundles are stored in-memory behind a random 192-bit expiring token (`server/reportStore.mjs`, 30 min TTL, pruned every 5 min); `POST /api/report-pdf` resolves the token and renders via `puppeteer-core` (`server/pdf/renderPdf.mjs`), returning `PDF_RUNTIME_UNAVAILABLE` if no `PUPPETEER_EXECUTABLE_PATH` is configured. Browser print is the fallback path with no server dependency.
- **Security** (`docs/security-and-privacy.md`): Helmet, 64kB JSON body limit, per-route rate limits, request IDs, optional strict `ALLOWED_ORIGIN` allowlist, and a Fetch-Metadata (`sec-fetch-site: cross-site`) rejection for non-GET requests substitute for CSRF tokens since cookie auth isn't used. Log helper `logInfo` redacts any metadata key matching `date|time|place|location|name|key|secret|token|body` — keep using it rather than raw `console.log` for anything touching request data.

## Modes / env

- `VITE_DATA_MODE=fixture` (default): browser uses the bundled `MockZwdsProvider`, no network. `VITE_DATA_MODE=bff`: browser talks only to same-origin `/api` via `BffZwdsProvider`.
- `FUFIRE_MODE=fixture` (default): BFF validates/normalizes the golden fixture. `FUFIRE_MODE=live`: requires `FUFIRE_BASE_URL`, `FUFIRE_API_KEY`, `FUFIRE_AUTH_HEADER` (+ optional `FUFIRE_AUTH_SCHEME`, `FUFIRE_GEOCODE_PATH`); currently `UNVERIFIED` — no approved staging credentials exist (`docs/KNOWN_LIMITATIONS.md`).
- Copy `.env.example`; all FuFirE values are server-side only and must never reach the client bundle.

## Docs worth reading before non-trivial changes

- `docs/data-contract.md` — raw/normalized schema invariants
- `docs/evidence-model.md` — evidence ID scheme and fail-closed section rejection
- `docs/security-and-privacy.md` — logging redaction, rate limits, CSRF approach
- `docs/architecture.md` — same diagram as above, source of truth if this file drifts
- `docs/KNOWN_LIMITATIONS.md` — tracked gaps (no lockfile committed at last check, live FuFirE/geocode unverified, reviewed ruleset hashes `SOURCE_NEEDED`, LLM corpus `SOURCE_NEEDED`) — check before assuming a capability works end-to-end
