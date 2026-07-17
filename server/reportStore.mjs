import crypto from 'node:crypto';

const MAX_AGE_MS = 30 * 60 * 1000;
const records = new Map();

export function storeReport(report, sections) {
  const token = crypto.randomBytes(24).toString('base64url');
  records.set(token, { report, sections, createdAt: Date.now() });
  return token;
}

export function getReport(token) {
  const record = records.get(token);
  if (!record) return null;
  if (Date.now() - record.createdAt > MAX_AGE_MS) {
    records.delete(token);
    return null;
  }
  return record;
}

export function pruneReports() {
  const now = Date.now();
  for (const [token, record] of records) if (now - record.createdAt > MAX_AGE_MS) records.delete(token);
}

// Test-only introspection: lets a test prove pruneReports reclaims never-read stale
// records (the unbounded-growth risk) without going through getReport's lazy eviction.
export function reportCount() {
  return records.size;
}

// Test-only: clear the in-memory store so tests are isolated from the module-level singleton.
export function resetReports() {
  records.clear();
}