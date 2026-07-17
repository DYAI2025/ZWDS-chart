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

  // AMD-002 / RISK-005: an exported report whose source is not yet reviewed must
  // carry the same persistent "illustrative, unreviewed — not authoritative"
  // notice as the on-screen report. The golden fixture is SOURCE_NEEDED, so the
  // notice must be present in BOTH locales.
  it('carries the not-authoritative notice for a non-reviewed (SOURCE_NEEDED) report', () => {
    expect(report.calculation.sourceStatus).not.toBe('SOURCE_REVIEWED');
    const en = renderReportHtml(report, 'en-US');
    expect(en).toContain('Illustrative, unreviewed — not authoritative');
    expect(en).toContain('not an authoritative traditional-school reading');
    const de = renderReportHtml(report, 'de-DE');
    expect(de).toContain('Illustrativ, ungeprüft — nicht maßgeblich');
  });

  it('omits the not-authoritative notice once the report is genuinely SOURCE_REVIEWED', () => {
    const reviewed = { ...report, calculation: { ...report.calculation, sourceStatus: 'SOURCE_REVIEWED' } };
    const html = renderReportHtml(reviewed, 'en-US');
    expect(html).not.toContain('Illustrative, unreviewed');
    expect(html).not.toContain('not an authoritative traditional-school reading');
  });
});