import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { normalizeRaw, generateSections, ContractError, assertRulesetMetadata, rulesetMetadataSchema } from './normalize.mjs';
import { calculateZwds, fetchRulesetMetadata, UpstreamError } from './fufireClient.mjs';
import { createGeocodeProvider } from './geocodeProviders.mjs';
import { storeReport, getReport, pruneReports } from './reportStore.mjs';
import { renderPdf } from './pdf/renderPdf.mjs';
import { loadReviewedCorpus } from './llm/corpus.mjs';
import { createLlmClient } from './llm/client.mjs';
import { interpretSections } from './llm/interpret.mjs';
import { loadRulesetAttestation } from './governance/attestation.mjs';
import { verifyRulesetGovernance } from './governance/verify.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = process.env.FUFIRE_FIXTURE_PATH ?? path.join(__dirname, '..', 'tests', 'fixtures', 'fufire', 'zwds-core-seed-shanghai-1984.json');
const RULESET_FIXTURE_PATH = path.join(__dirname, '..', 'tests', 'fixtures', 'fufire', 'ruleset-core-seed.json');

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(8787),
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  FUFIRE_MODE: z.enum(['fixture','live']).default('fixture'),
  FUFIRE_BASE_URL: z.string().url().optional(),
  FUFIRE_API_KEY: z.string().min(1).optional(),
  FUFIRE_AUTH_HEADER: z.string().regex(/^[a-z0-9-]+$/i).optional(),
  FUFIRE_AUTH_SCHEME: z.string().max(32).optional(),
  FUFIRE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  FUFIRE_GEOCODE_PATH: z.string().startsWith('/').optional(),
  RULESET_ID: z.string().default('zwds.fufire.core-seed.v1'),
  LLM_ENABLED: z.enum(['true','false']).default('false').transform((value) => value === 'true'),
  // The corpus status may DECLARE SOURCE_REVIEWED, but declaring it is not sufficient: enabling
  // the LLM also requires a corpus file that loads, validates, and hash-matches at boot (see
  // loadReviewedCorpus). Default stays SOURCE_NEEDED so the fail-closed default is unchanged.
  LLM_CORPUS_STATUS: z.enum(['SOURCE_NEEDED','SOURCE_REVIEWED']).default('SOURCE_NEEDED'),
  LLM_CORPUS_PATH: z.string().trim().min(1).optional(),
  LLM_CORPUS_SHA256: z.string().trim().regex(/^[a-f0-9]{64}$/i).optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).default('claude-sonnet-5'),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(30000),
  // .trim(): a stray trailing space in the stored value (seen on Railway as
  // "/usr/bin/chromium  ") makes Puppeteer look for a path that does not exist and fail
  // PDF render with an opaque 503. Normalize it here so config can't be broken by whitespace.
  PUPPETEER_EXECUTABLE_PATH: z.string().trim().min(1).optional(),
  // Source-governance: a reviewer's hash-pinned ruleset attestation. Absent by default, so the
  // report stays SOURCE_NEEDED / not-authoritative. A declared-but-unverifiable attestation
  // fails boot (loadRulesetAttestation). Never a fabricated sign-off.
  RULESET_ATTESTATION_PATH: z.string().trim().min(1).optional(),
  RULESET_ATTESTATION_SHA256: z.string().trim().regex(/^[a-f0-9]{64}$/i).optional(),
  ALLOWED_ORIGIN: z.string().url().optional(),
}).superRefine((config, context) => {
  if (config.PORT === 0 && config.NODE_ENV !== 'test') context.addIssue({ code: 'custom', path: ['PORT'], message: 'PORT=0 is allowed only in test mode' });
  if (config.FUFIRE_MODE === 'live') {
    for (const key of ['FUFIRE_BASE_URL','FUFIRE_API_KEY','FUFIRE_AUTH_HEADER']) {
      if (!config[key]) context.addIssue({ code: 'custom', path: [key], message: `${key} is required in live mode` });
    }
  }
  if (config.LLM_ENABLED) {
    if (config.LLM_CORPUS_STATUS !== 'SOURCE_REVIEWED') {
      context.addIssue({ code: 'custom', path: ['LLM_ENABLED'], message: 'LLM cannot be enabled while the reviewed corpus is SOURCE_NEEDED' });
    }
    for (const key of ['LLM_CORPUS_PATH', 'LLM_CORPUS_SHA256', 'LLM_API_KEY']) {
      if (!config[key]) context.addIssue({ code: 'custom', path: [key], message: `${key} is required when LLM is enabled` });
    }
  }
});

export const loadConfig = (env = process.env) => envSchema.parse(env);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
let fixtureRaw;
let fixtureRuleset;
const loadFixtureRaw = () => fixtureRaw ??= readJson(FIXTURE_PATH);
const loadFixtureRuleset = () => fixtureRuleset ??= rulesetMetadataSchema.parse(readJson(RULESET_FIXTURE_PATH));

function errorEnvelope(res, status, code, message, retryable = false) {
  return res.status(status).json({ error: { code, message, requestId: res.locals.requestId ?? crypto.randomUUID(), retryable } });
}

function logInfo(event, metadata = {}) {
  const denied = /date|time|place|location|name|key|secret|token|body/i;
  const safe = Object.fromEntries(Object.entries(metadata).filter(([key]) => !denied.test(key)));
  process.stdout.write(`${JSON.stringify({ level: 'info', event, ...safe })}\n`);
}

const birthInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  placeQuery: z.string().max(120).default(''),
  location: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), timezone: z.string().min(1).max(80), displayName: z.string().min(1).max(160), confirmed: z.literal(true) }).strict(),
  sexAtBirth: z.enum(['male','female']).optional(),
  directionMethod: z.enum(['year_stem_yinyang_and_sex','explicit','omit']),
  flowDirection: z.enum(['forward','backward']).optional(),
  locale: z.enum(['de-DE','en-US']),
  scriptVariant: z.literal('zh-Hant'),
  includeDecadalLimits: z.boolean(),
  interpret: z.boolean(),
}).strict().superRefine((value, context) => {
  if (value.directionMethod === 'year_stem_yinyang_and_sex' && !value.sexAtBirth) context.addIssue({ code: 'custom', path: ['sexAtBirth'], message: 'sexAtBirth is required for this direction method' });
  if (value.directionMethod === 'explicit' && !value.flowDirection) context.addIssue({ code: 'custom', path: ['flowDirection'], message: 'flowDirection is required for explicit direction' });
});

const limiter = (label, max) => rateLimit({
  windowMs: 60_000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => errorEnvelope(res, 429, 'RATE_LIMITED', `Too many ${label} requests.`, true),
});

export function createApp(config = loadConfig()) {
  const app = express();
  const geocodeProvider = createGeocodeProvider(config);
  // LLM stays fail-closed: loadReviewedCorpus THROWS (failing boot) if a corpus is declared
  // (LLM_CORPUS_PATH set) but cannot be read, hash-matched, or schema-validated. With no
  // corpus configured it returns SOURCE_NEEDED and createLlmClient returns null, so
  // interpretSections serves the deterministic sections and never emits ungrounded prose.
  const llmCorpus = config.LLM_ENABLED ? loadReviewedCorpus(config) : { status: 'SOURCE_NEEDED', rulesByKey: new Map() };
  const llmClient = createLlmClient(config);
  // Source-governance attestation loaded once. loadRulesetAttestation THROWS (failing boot) if
  // one is declared but not hash-verifiable; with none configured it returns SOURCE_NEEDED and
  // no chart is ever elevated to authoritative.
  const rulesetAttestation = loadRulesetAttestation(config);
  // Railway (and most PaaS) terminate TLS at a single reverse proxy that sets
  // X-Forwarded-For. Trust exactly one hop so express-rate-limit keys on the real
  // client IP instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. `1` (not `true`)
  // keeps it from trusting an arbitrary client-supplied chain.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(express.json({ limit: '64kb', strict: true }));
  app.use((req, res, next) => {
    res.locals.requestId = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'].slice(0, 100) : crypto.randomUUID();
    res.setHeader('x-request-id', res.locals.requestId);
    if (config.ALLOWED_ORIGIN && req.headers.origin && req.headers.origin !== config.ALLOWED_ORIGIN) return errorEnvelope(res, 403, 'ORIGIN_REJECTED', 'Request origin is not allowed.');
    if (req.method !== 'GET' && req.headers['sec-fetch-site'] === 'cross-site') return errorEnvelope(res, 403, 'CSRF_REJECTED', 'Cross-site write request rejected.');
    next();
  });

  app.get('/api/status', (_req, res) => res.json({ service: 'bazodiac-bff', status: 'ok', requestId: res.locals.requestId }));
  app.get('/api/config-status', (_req, res) => res.json({
    fufireConfigured: config.FUFIRE_MODE === 'live',
    liveFufireVerified: false,
    geocodeConfigured: config.FUFIRE_MODE === 'fixture' || Boolean(config.FUFIRE_GEOCODE_PATH),
    llmConfigured: config.LLM_ENABLED,
    llmCorpusStatus: config.LLM_CORPUS_STATUS,
    pdfConfigured: Boolean(config.PUPPETEER_EXECUTABLE_PATH),
    // Whether a source-governance attestation is configured (not whether any given chart
    // elevated — that also requires an exact live-hash match). Default: none.
    rulesetGovernance: rulesetAttestation.status === 'ATTESTED' ? 'ATTESTED' : 'SOURCE_NEEDED',
    dataMode: config.FUFIRE_MODE,
  }));

  app.post('/api/geocode', limiter('geocode', 30), async (req, res) => {
    const parsed = z.object({ query: z.string().min(2).max(120), language: z.enum(['de','en']).default('en') }).strict().safeParse(req.body);
    if (!parsed.success) return errorEnvelope(res, 400, 'VALIDATION_FAILED', 'Invalid geocode query.');
    try {
      const results = await geocodeProvider.search(parsed.data.query, parsed.data.language);
      return res.json({ providerId: config.FUFIRE_MODE === 'fixture' ? 'fixture-gazetteer' : 'fufire', results });
    } catch (error) {
      if (error instanceof UpstreamError) return errorEnvelope(res, error.status, error.code, error.message, error.retryable);
      return errorEnvelope(res, 502, 'GEOCODE_CONTRACT_MISMATCH', 'Geocoding returned an unsupported response.');
    }
  });

  app.post('/api/zwds/calculate', limiter('calculate', 10), async (req, res) => {
    const parsed = birthInputSchema.safeParse(req.body);
    if (!parsed.success) return errorEnvelope(res, 400, 'VALIDATION_FAILED', parsed.error.issues[0]?.message ?? 'Invalid input.');
    try {
      const input = parsed.data;
      const raw = config.FUFIRE_MODE === 'fixture' ? loadFixtureRaw() : await calculateZwds(input, config);
      if (config.FUFIRE_MODE === 'fixture') assertFixtureCompatible(raw, input);
      if (raw.ruleset?.ruleset_id !== config.RULESET_ID) throw new ContractError('FUFIRE_RULESET_MISMATCH', 'The response uses an unexpected ruleset.');
      const metadata = config.FUFIRE_MODE === 'fixture' ? loadFixtureRuleset() : await fetchRulesetMetadata(raw.ruleset.ruleset_id, config);
      assertRulesetMetadata(raw.ruleset, metadata);
      const report = normalizeRaw(raw, config.FUFIRE_MODE, rulesetAttestation);
      report.birthInputSummary.locationDisplayName = input.location.displayName;
      const interpretation = input.interpret ? generateSections(report) : { sections: [], warnings: [] };
      report.quality.warnings.push(...interpretation.warnings);
      // Fail-closed LLM synthesis: only runs with a validated corpus; any rejection falls back
      // to the deterministic sections (llmUsed stays false). Deterministic path is unchanged.
      const interpreted = interpretation.sections.length > 0
        ? await interpretSections(interpretation.sections, { corpus: llmCorpus, client: llmClient, locale: input.locale, onReject: (code) => logInfo('llm.reject', { requestId: report.calculation.requestId, code }) })
        : { sections: interpretation.sections, llmUsed: false };
      const reportToken = storeReport(report, interpreted.sections);
      logInfo('calculate.ok', { requestId: report.calculation.requestId, mode: config.FUFIRE_MODE, rulesetId: report.calculation.rulesetId, fingerprint: report.calculation.chartFingerprint, llmUsed: interpreted.llmUsed });
      return res.json({ report, sections: interpreted.sections, reportToken, llmUsed: interpreted.llmUsed, llmCorpusStatus: config.LLM_CORPUS_STATUS });
    } catch (error) {
      if (error?.code === 'FIXTURE_PROFILE_MISMATCH') return errorEnvelope(res, 409, error.code, error.message);
      if (error instanceof ContractError) return errorEnvelope(res, 502, error.code, error.message);
      if (error instanceof UpstreamError) return errorEnvelope(res, error.status, error.code, error.message, error.retryable);
      logInfo('calculate.error', { requestId: res.locals.requestId });
      return errorEnvelope(res, 502, 'FUFIRE_UPSTREAM_ERROR', 'The calculation service could not produce a supported chart.', true);
    }
  });

  app.post('/api/zwds/interpret', limiter('interpret', 10), async (req, res, next) => {
    const parsed = z.object({ report: z.record(z.string(), z.unknown()), locale: z.enum(['de-DE','en-US']) }).strict().safeParse(req.body);
    if (!parsed.success || !Array.isArray(parsed.data?.report?.evidenceIndex)) return errorEnvelope(res, 400, 'VALIDATION_FAILED', 'Invalid normalized report.');
    const rep = parsed.data.report;
    // Structural guard: a malformed report must yield 400 VALIDATION_FAILED, not a 500 from a
    // generateSections field deref — 500 stays reserved for genuine internal faults.
    if (!rep.calculation || !Array.isArray(rep.palaces) || !Array.isArray(rep.stars) || !rep.quality || !Array.isArray(rep.decades)) {
      return errorEnvelope(res, 400, 'VALIDATION_FAILED', 'Invalid normalized report.');
    }
    try {
      const result = generateSections(rep);
      const interpreted = result.sections.length > 0
        ? await interpretSections(result.sections, { corpus: llmCorpus, client: llmClient, locale: parsed.data.locale, onReject: (code) => logInfo('llm.reject', { code }) })
        : { sections: result.sections, llmUsed: false };
      return res.json({ sections: interpreted.sections, warnings: result.warnings, llmUsed: interpreted.llmUsed, llmCorpusStatus: config.LLM_CORPUS_STATUS });
    } catch (error) {
      // AMD-001 / REQ-019: unknown / unsupported / unresolved evidence fails closed (no partial report).
      if (error instanceof ContractError) return errorEnvelope(res, 502, error.code, error.message);
      return next(error);
    }
  });

  app.get('/api/zwds/ruleset-status', async (req, res) => {
    // A malformed request (no rulesetId) is a client error, not a missing resource — 400 so a
    // caller that forgot the param is not told the ruleset does not exist. A rulesetId that IS
    // supplied but does not match still fails closed as 404: never return metadata for an
    // unrecognized ruleset.
    const rulesetId = String(req.query.rulesetId ?? '');
    if (rulesetId === '') return errorEnvelope(res, 400, 'VALIDATION_FAILED', 'rulesetId is required.');
    if (rulesetId !== config.RULESET_ID) return errorEnvelope(res, 404, 'FUFIRE_UNKNOWN_RULESET', 'Unknown ruleset.');
    try {
      const metadata = config.FUFIRE_MODE === 'fixture' ? loadFixtureRuleset() : rulesetMetadataSchema.parse(await fetchRulesetMetadata(rulesetId, config));
      // Apply source-governance: a hash-pinned reviewer attestation matching this ruleset's
      // digest elevates it to SOURCE_REVIEWED (active); otherwise it stays under_review.
      const gov = verifyRulesetGovernance({
        rulesetId: metadata.ruleset_id,
        rulesetVersion: metadata.ruleset_version,
        rulesetSha256: metadata.ruleset_sha256,
        crosscheckStatus: metadata.ruleset_sha256 ? 'MATCHED' : 'SOURCE_NEEDED',
        rawSourceStatus: metadata.source_status,
        hasBlockedEvidence: false,
      }, rulesetAttestation);
      return res.json({
        rulesetId,
        status: gov.sourceStatus === 'SOURCE_REVIEWED' ? 'active' : 'under_review',
        displayVersion: `Core Seed ${metadata.ruleset_version}`,
        rulesetVersion: metadata.ruleset_version,
        rulesetSha256: metadata.ruleset_sha256,
        sourceStatus: gov.sourceStatus,
        crosscheckStatus: gov.governanceStatus === 'MISMATCH' ? 'MISMATCH' : (metadata.ruleset_sha256 ? 'MATCHED' : 'SOURCE_NEEDED'),
        governance: { status: gov.governanceStatus, reviewedBy: gov.reviewer },
      });
    } catch (error) {
      if (error instanceof UpstreamError) return errorEnvelope(res, error.status, error.code, error.message, error.retryable);
      return errorEnvelope(res, 502, 'FUFIRE_RULESET_METADATA_CONTRACT', 'Ruleset metadata is unsupported.');
    }
  });

  app.post('/api/report-pdf', limiter('pdf', 5), async (req, res) => {
    const parsed = z.object({ reportToken: z.string().min(20).max(200), locale: z.enum(['de-DE','en-US']) }).strict().safeParse(req.body);
    if (!parsed.success) return errorEnvelope(res, 400, 'VALIDATION_FAILED', 'Invalid PDF request.');
    // Validate the request (token lookup) BEFORE probing Chromium runtime availability, so an
    // unknown or expired token is rejected with 404 even when no PDF runtime is configured.
    const stored = getReport(parsed.data.reportToken);
    if (!stored) return errorEnvelope(res, 404, 'REPORT_TOKEN_UNKNOWN', 'Report token is unknown or expired.');
    if (!config.PUPPETEER_EXECUTABLE_PATH) return errorEnvelope(res, 503, 'PDF_RUNTIME_UNAVAILABLE', 'Server-side PDF requires a configured Chromium runtime.', true);
    try {
      const pdf = await renderPdf(stored.report, parsed.data.locale, config.PUPPETEER_EXECUTABLE_PATH);
      const safeFingerprint = stored.report.calculation.chartFingerprint.replace(/[^a-z0-9_-]/gi, '').slice(0, 60) || 'report';
      res.setHeader('content-type', 'application/pdf');
      res.setHeader('content-disposition', `attachment; filename="bazodiac-${safeFingerprint}.pdf"`);
      res.setHeader('cache-control', 'no-store');
      return res.status(200).send(Buffer.from(pdf));
    } catch (error) {
      // Redaction-safe diagnostics: the underlying Puppeteer/Chromium failure reason and
      // whether the configured executable actually exists on disk (ENOENT => runtime not
      // installed; shared-lib error => installed but missing deps). No PII in any field.
      logInfo('pdf.error', {
        requestId: res.locals.requestId,
        errKind: error?.name,
        errMsg: String(error?.message ?? error).slice(0, 300),
        execExists: config.PUPPETEER_EXECUTABLE_PATH ? fs.existsSync(config.PUPPETEER_EXECUTABLE_PATH) : false,
        execPath: config.PUPPETEER_EXECUTABLE_PATH,
      });
      return errorEnvelope(res, 503, 'PDF_RENDER_FAILED', 'The PDF renderer failed.', true);
    }
  });

  // Single-service deploy (Railway): serve the built SPA. All /api/* routes above take
  // precedence; an unknown /api/* path still falls through to the JSON 404 below. Any other
  // GET returns index.html for client-side routing. No-op when dist/ is absent (API-only run).
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
  }

  app.use((_req, res) => errorEnvelope(res, 404, 'NOT_FOUND', 'Unknown route.'));
  app.use((_error, _req, res, _next) => errorEnvelope(res, 500, 'INTERNAL', 'Internal error.'));
  return app;
}

export function assertFixtureCompatible(raw, input) {
  // Real FuFirE nests the birth profile under normalized_input.birth.{...}.
  const birth = raw.normalized_input.birth;
  const [date, timePart] = birth.datetime_local.split('T');
  const mismatches = [];
  if (input.date !== date) mismatches.push('date');
  if (input.time !== timePart?.slice(0, 5)) mismatches.push('time');
  if (input.location.timezone !== birth.timezone) mismatches.push('timezone');
  if (Math.abs(input.location.lat - birth.location.lat) > 0.01) mismatches.push('lat');
  if (Math.abs(input.location.lon - birth.location.lon) > 0.01) mismatches.push('lon');
  if (input.sexAtBirth !== birth.sex_at_birth) mismatches.push('sexAtBirth');
  if (mismatches.length) {
    const error = new Error(`Fixture mode supports only the bundled demo profile. Deviating fields: ${mismatches.join(', ')}`);
    error.code = 'FIXTURE_PROFILE_MISMATCH';
    throw error;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const config = loadConfig();
  const app = createApp(config);
  const server = app.listen(config.PORT, () => logInfo('bff.listen', { port: config.PORT, mode: config.FUFIRE_MODE }));
  const pruneTimer = setInterval(pruneReports, 5 * 60 * 1000);
  pruneTimer.unref();
  const shutdown = (signal) => {
    logInfo('bff.shutdown', { signal });
    clearInterval(pruneTimer);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}