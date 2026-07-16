# Architecture

```text
React components -> AppContext/reducer -> ZwdsDataProvider
  -> NormalizedZwdsReport + local catalogue only

BffZwdsProvider -> same-origin /api
MockZwdsProvider -> normalized demo bundle only

Express BFF -> FuFirE client / GeocodeProvider -> strict raw contract
  -> fail-closed invariants -> normalizer -> Evidence Index/rules
  -> expiring report store -> PDF renderer
```

Browser code cannot import `server/`, contain FuFirE endpoint paths or access credentials. `scripts/architecture-gates.mjs` and ESLint restricted-import rules enforce this.

Frontend responsibilities are split across `components/hero`, `navigation`, `intake`, `atlas`, `report`, `evidence` and `common`. `src/App.tsx` only composes `AppProvider` and `AppShell`.

`chart.star_placements[]` is authoritative. Palaces preserve only `placement_ids[]`. UI selectors resolve placements by ID. Transformations are copied only from a concrete placement's `transformation_types[]` and retain that `placementId`.

AbortSignals cancel provider work. Motion responds to visibility/reduced-motion. Dialog listeners and body locks clean up. Chromium closes in `finally`; direct server execution handles SIGINT/SIGTERM and prunes expired report tokens.