# Verification

| Claim | Evidence class | Command/test | Result | Limitation |
|---|---|---|---|---|
| Production bundle | runtime-verified | `npm run build` | PASS, 52 modules, 311.03 kB | Not a UI proof. |
| Dependencies | runtime-verified | package installer | PASS, 367 packages | Reports 1 high/1 low advisory. |
| Type diagnostics | source-inspected | workspace diagnostics | No surfaced diagnostics | CLI typecheck unavailable. |
| PORT=0 fix | source-inspected | integration test/env refinement | Test-only 0; production rejects | Vitest unexecuted. |
| Placement contract | source-inspected | golden fixture tests | Positive and manipulated cases implemented | Unexecuted. |
| Ruleset crosscheck | source-inspected | unit/BFF tests | Available fields compared | Live metadata unverified. |
| PDF | source-inspected | HTML/blocker tests | Renderer implemented | Chromium smoke blocked. |
| Browser/axe | source-inspected | Playwright spec | Four scenarios implemented | Browser unexecuted. |
| Lint/architecture | source-inspected | configs/gate script | Configured | Commands unexecuted. |
| Audit | reported-only | install output | 1 high, 1 low | Exact chain unavailable. |

Unavailable commands: `node --version`, `npm --version`, `npm ci`, `npx tsc --noEmit`, `npx eslint .`, architecture gate, Vitest, Playwright and `npm audit --audit-level=high`. None are claimed as passed.