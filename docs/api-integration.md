# API Integration

Presentation components do not call `fetch`; providers own same-origin transport.

| Route | Purpose |
|---|---|
| `GET /api/status` | safe service state |
| `GET /api/config-status` | booleans, data mode and live verification flag |
| `POST /api/geocode` | validated location candidates with provider/confidence |
| `POST /api/zwds/calculate` | normalized report, deterministic sections, private PDF token |
| `POST /api/zwds/interpret` | deterministic evidence-bound sections; LLM disabled |
| `GET /api/zwds/ruleset-status` | ruleset metadata/crosscheck projection |
| `POST /api/report-pdf` | PDF from expiring private report token |

The live server calls `POST /v1/calculate/zwds` and `GET /v1/metadata/zwds/rulesets/{ruleset_id}`. Authentication header and scheme are mandatory configuration because approved auth documentation is absent; code does not guess. Timeout defaults to 15 seconds. Auth, validation, rate-limit, timeout, network and contract errors map to distinct safe envelopes without upstream bodies.

Ruleset ID/version/hash, catalogue/table hashes, policy IDs/hashes, age reckoning and source status are compared. Null fixture values remain `SOURCE_NEEDED` rather than being invented.