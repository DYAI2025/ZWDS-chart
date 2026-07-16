# Version 2 Baseline

Version 2 contained React 19/Vite/strict TypeScript, an Express 5 BFF, fixture profile gate, provider boundary, simplified raw validator, normalizer, Evidence Index, deterministic text, canonical display IDs, a 4×4 perimeter grid, localization and print styles.

The repository did not expose a lockfile. `package.json` exposed only `dev`, `build` and `preview`. ESLint, Playwright, axe, Puppeteer and architecture gates were absent. `App.tsx` contained approximately 1,500 lines.

| Requested command | Baseline result | Evidence |
|---|---|---|
| `node --version` | `UNVERIFIED` | Arbitrary shell execution is unavailable. |
| `npm --version` | `UNVERIFIED` | Same environment limitation. |
| `find ...` | Replaced by repository file-list tool | Version 2 tree inspected. |
| `cat package.json` | Inspected | React 19.2.6, Express 5.2.1, only three scripts. |
| `npm ci` | `BLOCKED` | No exposed lockfile. |
| `npx tsc --noEmit` | `UNVERIFIED` | CLI unavailable; editor diagnostics are not equivalent evidence. |
| `npm run build` | Passed | Vite build executed through the project tool. |
| `npx vitest run` | Baseline defect source-confirmed | `PORT=0` conflicted with `min(1)`. CLI rerun unavailable. |
| `npm audit --audit-level=high` | `UNVERIFIED` | Installer reports 1 high and 1 low advisory. |

Source inspection confirmed invented placement IDs, first-star transformation assignment, missing metadata crosscheck, placeholder live geocoding/PDF, monolithic App and no global form-error focus.

Unavailable external inputs: approved FuFirE staging authentication, reviewed SHA-256 metadata, reviewed LLM corpus, Chromium and verified CJK runtime.