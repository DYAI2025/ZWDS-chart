import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderPdf } from '../../server/pdf/renderPdf.mjs';
import { normalizeRaw } from '../../server/normalize.mjs';

// REQ-013 binary smoke — proves the server PDF path produces a real PDF with a REAL
// Chromium runtime, not just that the HTML template is well-formed (pdfHtml.test.mjs).
// This is the local/CI-with-runtime counterpart to the deployed-URL binary smoke:
// on Railway, nixpacks installs /usr/bin/chromium + fonts-noto-cjk and this same
// renderPdf runs against a genuine Berlin/Shanghai report. Runtime-GATED: when no
// Chromium executable is discoverable, the smoke skips rather than failing, so CI
// without a browser stays green (the KNOWN_LIMITATIONS EXTERNAL_RUNTIME_BLOCKER).

function firstExecutable(candidates) {
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      /* not present / not executable */
    }
  }
  return null;
}

// Shallow scan of the puppeteer download cache for a headless-shell / chrome binary.
function findInPuppeteerCache() {
  const base = path.join(os.homedir(), '.cache', 'puppeteer');
  const wanted = new Set(['chrome-headless-shell', 'Google Chrome for Testing', 'chrome', 'chromium']);
  const stack = [{ dir: base, depth: 0 }];
  while (stack.length) {
    const { dir, depth } = stack.pop();
    if (depth > 6) continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push({ dir: full, depth: depth + 1 });
      else if (wanted.has(entry.name)) {
        const hit = firstExecutable([full]);
        if (hit) return hit;
      }
    }
  }
  return null;
}

const chromium =
  firstExecutable([
    process.env.PUPPETEER_EXECUTABLE_PATH ?? '',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ]) ?? findInPuppeteerCache();

const fixture = JSON.parse(fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8'));
const report = normalizeRaw(fixture);

describe.skipIf(!chromium)('REQ-013 server PDF binary smoke (real Chromium runtime)', () => {
  it('renders a non-trivial %PDF document from a normalized report', async () => {
    const bytes = await renderPdf(report, 'en-US', chromium);
    const buffer = Buffer.from(bytes);
    // Real PDF magic header.
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    // A one-page A4 chart with the grid + fonts is comfortably over 20 KB; a near-empty
    // or error output would be far smaller. Guards against a "launched but rendered nothing" pass.
    expect(buffer.byteLength).toBeGreaterThan(20_000);
    // A valid PDF ends with the EOF marker.
    expect(buffer.subarray(-8).toString('latin1')).toContain('%%EOF');
  }, 60_000);
});

// Visible in test output so a skip is never mistaken for a pass (no silent caps).
if (!chromium) {
  process.stderr.write('[pdf-render-smoke] SKIPPED — no Chromium runtime discoverable (EXTERNAL_RUNTIME_BLOCKER).\n');
}
