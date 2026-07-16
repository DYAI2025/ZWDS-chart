import { describe, it, expect } from 'vitest';
import { renderReportHtml } from '../../server/pdf/renderPdf.mjs';
import fs from 'node:fs';
import { normalizeRaw } from '../../server/normalize.mjs';

const fixture = JSON.parse(fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8'));
const report = normalizeRaw(fixture);

describe('deterministic PDF report HTML', () => {
  it('contains German labels, real Hanzi and report trace metadata', () => {
    const html = renderReportHtml(report, 'de-DE');
    expect(html).toContain('Zehnjährige Themenfenster');
    expect(html).toContain('命宮');
    expect(html).toContain('太陽');
    expect(html).toContain(report.calculation.chartFingerprint);
    expect(html).toContain(report.calculation.sourceStatus);
    expect(html).not.toContain('<script');
  });
  it('renders all twelve perimeter palace sections plus the centre', () => {
    const html = renderReportHtml(report, 'en-US');
    expect((html.match(/class="palace"/g) ?? [])).toHaveLength(12);
    expect(html).toContain('class="center"');
  });
});