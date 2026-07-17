import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storeReport, getReport, pruneReports, reportCount, resetReports } from '../../server/reportStore.mjs';

// REQ-017 (T07): PDF report sessions are bounded — random high-entropy tokens,
// lazy expiry eviction on read, and proactive pruning. These tests lock that
// contract so a future regression (unbounded retention, guessable tokens,
// non-evicting reads) fails loudly. Time is driven with fake timers so the
// 30-minute MAX_AGE_MS window is exercised deterministically.
const MAX_AGE_MS = 30 * 60 * 1000;
const sampleReport = () => ({ calculation: { chartFingerprint: 'zwds-core-seed' } });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'));
  resetReports(); // isolate from the module-level records singleton (prior tests leave entries)
});
afterEach(() => vi.useRealTimers());

describe('reportStore bounded PDF sessions (REQ-017)', () => {
  it('stores a report and returns the same record within the window', () => {
    const sections = [{ id: 'summary' }];
    const token = storeReport(sampleReport(), sections);
    const record = getReport(token);
    expect(record).not.toBeNull();
    expect(record.report.calculation.chartFingerprint).toBe('zwds-core-seed');
    expect(record.sections).toBe(sections);
    expect(record.createdAt).toBe(Date.now());
  });

  it('evicts an expired record on read once MAX_AGE_MS has elapsed', () => {
    const token = storeReport(sampleReport(), []);
    // Just inside the window: still retrievable.
    vi.advanceTimersByTime(MAX_AGE_MS);
    expect(getReport(token)).not.toBeNull();
    // One millisecond past the window: getReport returns null AND deletes the record.
    vi.advanceTimersByTime(1);
    expect(getReport(token)).toBeNull();
    // Rewinding time cannot resurrect it — proving the read evicted, not just rejected.
    vi.setSystemTime(new Date('2026-07-17T00:00:00.000Z'));
    expect(getReport(token)).toBeNull();
  });

  it('pruneReports reclaims never-read stale records and keeps fresh ones', () => {
    const staleToken = storeReport(sampleReport(), []);
    // Advance past the window, then store a fresh record at the new "now".
    vi.advanceTimersByTime(MAX_AGE_MS + 1);
    const freshToken = storeReport(sampleReport(), []);
    // Both are still IN the store — the stale one has not been read, so getReport's lazy
    // eviction has NOT fired. This is exactly the unbounded-growth case only prune addresses.
    expect(reportCount()).toBe(2);
    pruneReports();
    // Count drops to 1 because PRUNE removed the stale record (proven without reading it,
    // so getReport's lazy eviction cannot be masking the result); the fresh one survives.
    expect(reportCount()).toBe(1);
    expect(getReport(freshToken)).not.toBeNull();
    expect(getReport(staleToken)).toBeNull();
  });

  it('issues a high-entropy base64url token (32 chars, url-safe charset)', () => {
    const token = storeReport(sampleReport(), []);
    // 24 random bytes -> base64url with no padding -> exactly 32 chars.
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    // base64url must not contain standard-base64-only or padding characters.
    expect(token).not.toMatch(/[+/=]/);
    // Distinct tokens across calls (randomness, not a counter).
    expect(storeReport(sampleReport(), [])).not.toBe(token);
  });
});
