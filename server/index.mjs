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
  LLM_CORPUS_STATUS: z.literal('SOURCE_NEEDED').default('SOURCE_NEEDED'),
  PUPPETEER_EXECUTABLE_PATH: z.string().min(1).optional(),
  ALLOWED_ORIGIN: z.string().url().optional(),
}).superRefine((config, context) => {
  if (config.PORT === 0 && config.NODE_ENV !== 'test') context.addIssue({ code: 'custom', path: ['PORT'], message: 'PORT=0 is allowed only in test mode' });
  if (config.FUFIRE_MODE === 'live') {
    for (const key of ['FUFIRE_BASE_URL','FUFIRE_API_KEY','FUFIRE_AUTH_HEADER']) {
      if (!config[key]) context.addIssue({ code: 'custom', path: [key], message: `${key} is required in live mode` });
    }
  }
  if (config.LLM_ENABLED) context.addIssue({ code: 'custom', path: ['LLM_ENABLED'], message: 'LLM cannot be enabled while the reviewed corpus is SOURCE_NEEDED' });
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
    llmConfigured: false,
    llmCorpusStatus: config.LLM_CORPUS_STATUS,
    pdfConfigured: Boolean(config.PUPPETEER_EXECUTABLE_PATH),
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
      const report = normalizeRaw(raw, config.FUFIRE_MODE);
      report.birthInputSummary.locationDisplayName = input.location.displayName;
      const interpretation = input.interpret ? generateSections(report) : { sections: [], warnings: [] };
      report.quality.warnings.push(...interpretation.warnings);
      const reportToken = storeReport(report, interpretation.sections);
      logInfo('calculate.ok', { requestId: report.calculation.requestId, mode: config.FUFIRE_MODE, rulesetId: report.calculation.rulesetId, fingerprint: report.calculation.chartFingerprint });
      return res.json({ report, sections: interpretation.sections, reportToken });
    } catch (error) {
      if (error?.code === 'FIXTURE_PROFILE_MISMATCH') return errorEnvelope(res, 409, error.code, error.message);
      if (error instanceof ContractError) return errorEnvelope(res, 502, error.code, error.message);
      if (error instanceof UpstreamError) return errorEnvelope(res, error.status, error.code, error.message, error.retryable);
      logInfo('calculate.error', { requestId: res.locals.requestId });
      return errorEnvelope(res, 502, 'FUFIRE_UPSTREAM_ERROR', 'The calculation service could not produce a supported chart.', true);
    }
  });

  app.post('/api/zwds/interpret', limiter('interpret', 10), (req, res, next) => {
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
      return res.json({ sections: result.sections, warnings: result.warnings, llmUsed: false, llmCorpusStatus: 'SOURCE_NEEDED' });
    } catch (error) {
      // AMD-001 / REQ-019: unknown / unsupported / unresolved evidence fails closed (no partial report).
      if (error instanceof ContractError) return errorEnvelope(res, 502, error.code, error.message);
      return next(error);
    }
  });

  app.get('/api/zwds/ruleset-status', async (req, res) => {
    const rulesetId = String(req.query.rulesetId ?? '');
    if (rulesetId !== config.RULESET_ID) return errorEnvelope(res, 404, 'FUFIRE_UNKNOWN_RULESET', 'Unknown ruleset.');
    try {
      const metadata = config.FUFIRE_MODE === 'fixture' ? loadFixtureRuleset() : rulesetMetadataSchema.parse(await fetchRulesetMetadata(rulesetId, config));
      return res.json({ rulesetId, status: metadata.source_status === 'SOURCE_REVIEWED' ? 'active' : 'under_review', displayVersion: `Core Seed ${metadata.ruleset_version}`, rulesetVersion: metadata.ruleset_version, rulesetSha256: metadata.ruleset_sha256, sourceStatus: metadata.source_status, crosscheckStatus: metadata.ruleset_sha256 ? 'MATCHED' : 'SOURCE_NEEDED' });
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