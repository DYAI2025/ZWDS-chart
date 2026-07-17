// AMD-003 real-boundary pin / reconcile harness.
//
// Retrieves ONE real FuFirE response at the real calculate (+ optional geocode) boundary,
// pins it under tests/fixtures/fufire/pinned-real/, and reconciles it against the
// self-authored golden fixture AND the strict runtime contract — BEFORE any public
// "traceable to real data" claim. It is the gate that retires the AMD-001 x AMD-003
// over-refusal coupling: a real field the golden fixture never anticipated (a heterogeneous
// BLOCKED source_status, a MISMATCH crosscheck, unresolved evidence) triggers a HARD
// EVIDENCE_UNRESOLVED refusal in generateSections, and the pin surfaces that first.
//
// Run:  node --env-file=.env scripts/amd003-pin.mjs
// Requires FUFIRE_MODE=live plus the live FuFirE staging credentials in .env. It NEVER
// falls back to the fixture.
//
// Exit codes:
//   0  PASS         real response conforms to the pinned contract; no divergences.
//   1  PRECONDITION not live mode / invalid config (no boundary call attempted).
//   2  BOUNDARY     network/auth/upstream error at the calculate boundary (nothing pinned).
//   3  DIVERGENCE   response pinned, but reconcile found divergences (incl. the AMD-001 coupling).
//
// SECURITY: this script NEVER prints, logs, or writes the API key / auth header value / any
// secret. Only structural field names + statuses are emitted; config errors print offending
// KEY PATHS only (never values); network errors print the error CODE/HTTP status, never the
// body; and a defensive scrub refuses to write any response body that unexpectedly contains
// the configured credential.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { loadConfig } from '../server/index.mjs';
import { calculateZwds, geocodeWithFufire, UpstreamError } from '../server/fufireClient.mjs';
import { parseRawZwds, assertInvariants, normalizeRaw, generateSections, ContractError } from '../server/normalize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json');
const PINNED_DIR = path.join(REPO_ROOT, 'tests/fixtures/fufire/pinned-real');
const CALC_PIN = path.join(PINNED_DIR, 'calculate.json');
const GEO_PIN = path.join(PINNED_DIR, 'geocode.json');

const out = (s = '') => process.stdout.write(`${s}\n`);

// The bundled demo Shanghai-1984 profile (mirrors the input in tests/integration/bff.test.mjs).
const DEMO_INPUT = {
  date: '1984-02-01',
  time: '23:30',
  placeQuery: 'Shanghai',
  location: { lat: 31.2304, lon: 121.4737, timezone: 'Asia/Shanghai', displayName: 'Shanghai, China', confirmed: true },
  sexAtBirth: 'male',
  directionMethod: 'year_stem_yinyang_and_sex',
  locale: 'de-DE',
  scriptVariant: 'zh-Hant',
  includeDecadalLimits: true,
  interpret: true,
};
const GEO_QUERY = 'Shanghai';
const GEO_LANGUAGE = 'en';

// Geocode result contract — a kept-in-sync MIRROR of server/geocodeProviders.mjs
// (geocodeResultSchema + `.max(5)`). Duplicated so this harness does not modify server/;
// the server file remains the source of truth.
const geocodeResultSchema = z.object({
  displayName: z.string().min(1).max(160),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().min(1).max(80),
  providerId: z.string().min(1).max(80),
  confidence: z.number().min(0).max(1).nullable(),
}).strict();
const GEO_CONTRACT = z.array(geocodeResultSchema).max(5);

// Strict-schema enum universes — a MIRROR of server/normalize.mjs rawZwdsSchema. Used ONLY to
// CLASSIFY a structural diff value as "within the strict enum (benign — the fixture simply never
// exercised it)" vs "outside the strict enum (.strict() WILL reject)". parseRawZwds stays the
// authoritative rejection check; these constants only make the human report precise.
const STRICT = {
  star: ['ZI_WEI','TIAN_JI','TAI_YANG','WU_QU','TIAN_TONG','LIAN_ZHEN','TIAN_FU','TAI_YIN','TAN_LANG','JU_MEN','TIAN_XIANG','TIAN_LIANG','QI_SHA','PO_JUN','ZUO_FU','WEN_QU','YOU_BI','WEN_CHANG'],
  transformation: ['HUA_LU','HUA_QUAN','HUA_KE','HUA_JI'],
  palace: ['MING','XIONG_DI','FU_QI','ZI_NU','CAI_BO','JI_E','QIAN_YI','JIAO_YOU','GUAN_LU','TIAN_ZHAI','FU_DE','FU_MU'],
  branch: ['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'],
  stem: ['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'],
  bureau: ['WATER_2','WOOD_3','METAL_4','EARTH_5','FIRE_6'],
  sourceStatus: ['SOURCE_REVIEWED','SOURCE_NEEDED','BLOCKED'],
  calcStatus: ['SUCCESS','DEMO_FIXTURE','ERROR'],
  crosscheckStatus: ['MATCHED','SOURCE_NEEDED','MISMATCH'],
};

// Collect the value sets that matter for the deep-diff, defensively (a real response may be
// shaped differently from the fixture, so never assume fields exist).
function collect(raw) {
  const chart = raw?.chart ?? {};
  const placements = Array.isArray(chart.star_placements) ? chart.star_placements : [];
  const palaces = Array.isArray(chart.palaces) ? chart.palaces : [];
  const uniq = (arr) => [...new Set(arr.filter((v) => v !== undefined && v !== null))];
  const statuses = [];
  if (raw?.ruleset?.source_status) statuses.push(raw.ruleset.source_status);
  if (raw?.quality?.source_status) statuses.push(raw.quality.source_status);
  for (const p of placements) if (p?.source_status) statuses.push(p.source_status);
  for (const record of Array.isArray(raw?.provenance) ? raw.provenance : []) if (record?.source_status) statuses.push(record.source_status);
  for (const relation of Array.isArray(chart.relations) ? chart.relations : []) if (relation?.source_status) statuses.push(relation.source_status);
  return {
    topKeys: uniq(Object.keys(raw ?? {})),
    star: uniq(placements.map((p) => p?.star_id)),
    transformation: uniq(placements.flatMap((p) => Array.isArray(p?.transformation_types) ? p.transformation_types : [])),
    palace: uniq(palaces.map((p) => p?.palace_role_id)),
    branch: uniq(palaces.map((p) => p?.branch_id)),
    stem: uniq(palaces.map((p) => p?.stem_id)),
    bureau: uniq([chart?.five_elements_bureau?.id]),
    sourceStatus: uniq(statuses),
    calcStatus: uniq([raw?.quality?.calculation_status]),
    // Real quality carries crosschecks[] (each {oracle_id,status,note}), not a scalar crosscheck_status.
    crosscheckStatus: uniq((raw?.quality?.crosschecks ?? []).map((c) => c?.status)),
  };
}

// Informational structural diff of one enum dimension. Additions outside the strict enum are
// flagged [would-reject] (parseRawZwds already reports them authoritatively in step 1); additions
// inside the enum are benign [new-valid]; fixture-only values are [dropped].
function diffDimension(label, fixtureVals, realVals, strictVals) {
  const fset = new Set(fixtureVals);
  const rset = new Set(realVals);
  const added = realVals.filter((v) => !fset.has(v));
  const removed = fixtureVals.filter((v) => !rset.has(v));
  if (added.length === 0 && removed.length === 0) {
    out(`  [same] ${label}: real matches the golden fixture value set`);
    return;
  }
  for (const v of added) {
    const rejects = strictVals && !strictVals.includes(v);
    out(`  ${rejects ? '[would-reject]' : '[new-valid]'} ${label}: real adds '${v}'${rejects ? ` — NOT in strict ${label} enum, .strict() rejects` : ' (valid enum; fixture never exercised it)'}`);
  }
  for (const v of removed) out(`  [dropped] ${label}: golden fixture had '${v}', real omits it`);
}

// Reconcile the real /calculate response. Returns the list of BLOCKING/CRITICAL findings — the
// exact set that makes the strict .strict() schema reject OR that the AMD-001 guard hard-refuses.
function reconcileCalculate(realCalc, fixture) {
  out('');
  out('-- RECONCILE: calculate boundary vs golden fixture + strict contract --');
  const findings = [];

  // Step 1 — strict schema (.strict() + enum) acceptance. Authoritative rejection check.
  let parsed = null;
  try {
    parsed = parseRawZwds(realCalc);
    out('  [PASS] parseRawZwds  — strict schema accepts the real response');
  } catch (error) {
    const detail = error instanceof ContractError ? `${error.code}: ${error.message}` : `unexpected ${error?.name ?? 'Error'}`;
    out(`  [FAIL] parseRawZwds  — ${detail}`);
    findings.push({ severity: 'BLOCKING', step: 'schema', detail });
  }

  // Step 2 — structural invariants (12 palaces, unique branches, placement wiring, decades).
  if (parsed) {
    try {
      assertInvariants(parsed);
      out('  [PASS] assertInvariants — chart topology invariants hold');
    } catch (error) {
      const detail = error instanceof ContractError ? `${error.code}: ${error.message}` : `unexpected ${error?.name ?? 'Error'}`;
      out(`  [FAIL] assertInvariants — ${detail}`);
      findings.push({ severity: 'BLOCKING', step: 'invariants', detail });
    }
  }

  // Step 3 — full normalization to the evidence report.
  let report = null;
  if (parsed) {
    try {
      report = normalizeRaw(realCalc, 'live');
      out('  [PASS] normalizeRaw  — real response normalizes to the evidence report');
    } catch (error) {
      const detail = error instanceof ContractError ? `${error.code}: ${error.message}` : `unexpected ${error?.name ?? 'Error'}`;
      out(`  [FAIL] normalizeRaw  — ${detail}`);
      findings.push({ severity: 'BLOCKING', step: 'normalize', detail });
    }
  }

  // Step 4 — AMD-001 x AMD-003 fail-closed probe. This is the headline: interpretation of the
  // real chart either succeeds (coupling retired) or hard-refuses with EVIDENCE_UNRESOLVED.
  if (report) {
    try {
      const { sections } = generateSections(report);
      out(`  [PASS] generateSections — interpretation succeeds (${sections.length} evidence-bound sections, no over-refusal)`);
    } catch (error) {
      if (error instanceof ContractError && error.code === 'EVIDENCE_UNRESOLVED') {
        out(`  [FAIL] generateSections — AMD-001 HARD REFUSAL: ${error.message}`);
        findings.push({ severity: 'CRITICAL(AMD-001xAMD-003)', step: 'interpretation', detail: `EVIDENCE_UNRESOLVED: ${error.message}` });
      } else {
        const detail = error instanceof ContractError ? `${error.code}: ${error.message}` : `unexpected ${error?.name ?? 'Error'}`;
        out(`  [FAIL] generateSections — ${detail}`);
        findings.push({ severity: 'BLOCKING', step: 'interpretation', detail });
      }
    }
  }

  // Step 5 — structural key-set / enum deep-diff vs the golden fixture (informational; the
  // BLOCKING truth is already captured by steps 1 & 4 above).
  out('  -- structural diff vs golden fixture --');
  const f = collect(fixture);
  const r = collect(realCalc);
  const addedKeys = r.topKeys.filter((k) => !f.topKeys.includes(k));
  const missingKeys = f.topKeys.filter((k) => !r.topKeys.includes(k));
  if (addedKeys.length) out(`  [would-reject] top-level: real adds ${addedKeys.map((k) => `'${k}'`).join(', ')} — .strict() rejects unknown keys`);
  if (missingKeys.length) out(`  [would-reject] top-level: real is MISSING required ${missingKeys.map((k) => `'${k}'`).join(', ')}`);
  if (!addedKeys.length && !missingKeys.length) out('  [same] top-level keys: identical set');
  diffDimension('star_id', f.star, r.star, STRICT.star);
  diffDimension('transformation_id', f.transformation, r.transformation, STRICT.transformation);
  diffDimension('palace_id', f.palace, r.palace, STRICT.palace);
  diffDimension('branch_id', f.branch, r.branch, STRICT.branch);
  diffDimension('stem_id', f.stem, r.stem, STRICT.stem);
  diffDimension('bureau_id', f.bureau, r.bureau, STRICT.bureau);
  diffDimension('source_status', f.sourceStatus, r.sourceStatus, STRICT.sourceStatus);
  diffDimension('calculation_status', f.calcStatus, r.calcStatus, STRICT.calcStatus);
  diffDimension('crosscheck_status', f.crosscheckStatus, r.crosscheckStatus, STRICT.crosscheckStatus);

  return findings;
}

// Reconcile the real geocode boundary against the geocode result contract.
function reconcileGeocode(realGeo) {
  out('');
  out('-- RECONCILE: geocode boundary vs geocode result contract --');
  const findings = [];
  const parsed = GEO_CONTRACT.safeParse(realGeo);
  if (parsed.success) {
    out(`  [PASS] geocode contract — ${realGeo.length} result(s) conform to the geocode result schema`);
  } else {
    for (const issue of parsed.error.issues.slice(0, 8)) {
      const detail = `${issue.path.join('.') || '(root)'}: ${issue.code}`;
      out(`  [FAIL] geocode contract — ${detail}`);
      findings.push({ severity: 'BLOCKING', step: 'geocode-contract', detail });
    }
  }
  if (Array.isArray(realGeo) && realGeo.length === 0) {
    out('  [info] geocode returned 0 results — verify the staging gazetteer covers the query');
  }
  // NOTE: geocodeWithFufire already projects the upstream body to a fixed 6-field shape, so
  // raw provider extra-fields are not observable at this boundary (documented limitation).
  return findings;
}

// Write the pinned response, but first REFUSE if it unexpectedly embeds the configured
// credential. Returns whether the file was written.
function writeJsonSafe(filePath, payload, config, label) {
  const key = config.FUFIRE_API_KEY;
  if (key && key.length >= 8 && JSON.stringify(payload).includes(key)) {
    out(`  [SECURITY] ${label}: response body unexpectedly contained the configured credential — REFUSING to write ${path.basename(filePath)}`);
    return false;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  out(`  pinned -> ${path.relative(REPO_ROOT, filePath)}`);
  return true;
}

function reportBoundaryError(error, where) {
  out(`BOUNDARY ERROR at ${where} — ${where === 'calculate' ? 'nothing pinned.' : 'geocode.json not pinned (calculate evidence stands).'}`);
  if (error instanceof UpstreamError) out(`  code=${error.code} httpStatus=${error.status} retryable=${error.retryable}`);
  else if (error?.code) out(`  code=${error.code}`);
  else out(`  error=${error?.name ?? 'Error'}`);
}

async function main() {
  out('AMD-003 real-boundary pin / reconcile harness');
  out('=============================================');

  // Precondition: config must load AND be live mode. NEVER fall back to the fixture.
  let config;
  try {
    config = loadConfig(process.env);
  } catch (error) {
    out('PRECONDITION FAILED: configuration is invalid.');
    // Print offending KEY PATHS only — never received values — so no secret can leak here.
    const issues = error?.issues;
    if (Array.isArray(issues)) out(`  invalid config keys: ${issues.map((i) => i.path.join('.') || '(root)').join(', ')}`);
    else out('  configuration could not be parsed.');
    return 1;
  }
  if (config.FUFIRE_MODE !== 'live') {
    out(`PRECONDITION FAILED: FUFIRE_MODE is '${config.FUFIRE_MODE}', expected 'live'.`);
    out('  This harness only pins a REAL boundary response. It never falls back to the fixture.');
    out('  Run: node --env-file=.env scripts/amd003-pin.mjs   (with live FuFirE staging credentials)');
    return 1;
  }
  out(`mode=live  ruleset=${config.RULESET_ID}  authHeaderConfigured=${Boolean(config.FUFIRE_AUTH_HEADER)}  geocodeConfigured=${Boolean(config.FUFIRE_GEOCODE_PATH)}`);

  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
  fs.mkdirSync(PINNED_DIR, { recursive: true });

  // ── Calculate boundary (required) ──
  let realCalc;
  try {
    out('');
    out('Calling real FuFirE /v1/calculate/zwds ...');
    realCalc = await calculateZwds(DEMO_INPUT, config);
  } catch (error) {
    reportBoundaryError(error, 'calculate');
    return 2;
  }
  const wroteCalc = writeJsonSafe(CALC_PIN, realCalc, config, 'calculate');
  let clean = wroteCalc;
  const calcFindings = reconcileCalculate(realCalc, fixture);
  if (calcFindings.length) clean = false;

  // ── Geocode boundary (optional) ──
  let geoFindings = [];
  let geoError = null;
  if (config.FUFIRE_GEOCODE_PATH) {
    try {
      out('');
      out('Calling real FuFirE geocode boundary ...');
      // Real signature is geocodeWithFufire(query, language, config) — call it per the code,
      // not the 2-arg shorthand in the task text.
      const realGeo = await geocodeWithFufire(GEO_QUERY, GEO_LANGUAGE, config);
      if (!writeJsonSafe(GEO_PIN, realGeo, config, 'geocode')) clean = false;
      geoFindings = reconcileGeocode(realGeo);
      if (geoFindings.length) clean = false;
    } catch (error) {
      geoError = error;
      reportBoundaryError(error, 'geocode');
      clean = false;
    }
  } else {
    out('');
    out('geocode boundary skipped — FUFIRE_GEOCODE_PATH not set.');
  }

  // ── Verdict ──
  const findings = [...calcFindings, ...geoFindings];
  out('');
  out('==================== RECONCILE VERDICT ====================');
  if (clean && findings.length === 0) {
    out('PASS — the real response conforms to the pinned contract: strict schema, invariants,');
    out('       normalization, and the AMD-001 fail-closed interpretation all hold.');
    out('       Real-boundary-smoke evidence pinned. The "traceable to real data" precondition is met.');
    return 0;
  }
  out(`DIVERGENCE — ${findings.length} finding(s). Do NOT make a "traceable to real data" claim until resolved:`);
  findings.forEach((finding, i) => out(`  ${i + 1}. [${finding.severity}] (${finding.step}) ${finding.detail}`));
  if (geoError) out(`  * geocode boundary error: code=${geoError instanceof UpstreamError ? geoError.code : (geoError?.code ?? geoError?.name ?? 'Error')}`);
  if (!wroteCalc) out('  * calculate.json was NOT written (secret-scrub / write guard).');
  return 3;
}

main().then((code) => process.exit(code)).catch((error) => {
  // Last-resort guard: print the error NAME only, never the body/stack (which may embed the
  // upstream URL or other config), and exit non-zero honestly.
  process.stderr.write(`amd003-pin: unexpected failure (${error?.name ?? 'Error'})\n`);
  process.exit(1);
});
