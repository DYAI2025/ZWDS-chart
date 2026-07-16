# PDF Export

`POST /api/report-pdf` accepts an expiring report token and locale. `puppeteer-core` renders deterministic A4 HTML with the perimeter chart, Traditional Chinese text, placements, transformations, decades, source warnings, fingerprint and ruleset metadata.

The renderer waits for `document.fonts.ready`, controls margins/page breaks and closes Chromium in `finally`. Production must provide `PUPPETEER_EXECUTABLE_PATH` and Noto Serif TC or equivalent. Without Chromium the route returns `503 PDF_RUNTIME_UNAVAILABLE`.

HTML tests cover known labels, Hanzi, metadata and twelve palace sections. A real `%PDF` and extracted-text smoke remains `EXTERNAL_RUNTIME_BLOCKER` here.