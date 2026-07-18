import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import request from 'supertest';
import { createApp, loadConfig } from '../../server/index.mjs';
import { normalizeRaw } from '../../server/normalize.mjs';
import { loadRulesetAttestation } from '../../server/governance/attestation.mjs';
import { verifyRulesetGovernance } from '../../server/governance/verify.mjs';

// REQ-016 / AMD-002 — source-governance elevation. Proves the report can be raised to
// SOURCE_REVIEWED (dropping the not-authoritative notice) ONLY by a valid, hash-pinned
// reviewer attestation whose reviewed digest exactly matches the live ruleset — and that with
// no attestation (the default) the chart stays SOURCE_NEEDED / not-authoritative. Authority is
// never conferred by a fabricated sign-off; elevation fails closed on any mismatch.

const ATT_PATH = 'tests/fixtures/governance/ruleset-attestation.test.json';
const ATT_SHA = '758cb88a2a599cb11cc78a73e0471c8cd32976aeac59086e7bf305847f14e751';
const RULE_SHA = '3f5cef4a031d70860f87cd02052b39a8a944ce5e2bef67568f466a0d6f13c47f';
const base = { FUFIRE_MODE: 'fixture', NODE_ENV: 'test', PORT: '0', RULESET_ID: 'zwds.fufire.core-seed.v1' };
const attestedEnv = { ...base, RULESET_ATTESTATION_PATH: ATT_PATH, RULESET_ATTESTATION_SHA256: ATT_SHA };

const raw = JSON.parse(fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8'));
const attested = loadRulesetAttestation(loadConfig(attestedEnv));
const noAttestation = { status: 'SOURCE_NEEDED', attestation: null };
const okCtx = {
  rulesetId: 'zwds.fufire.core-seed.v1',
  rulesetVersion: '0.1.0',
  rulesetSha256: RULE_SHA,
  crosscheckStatus: 'MATCHED',
  rawSourceStatus: 'SOURCE_NEEDED',
  hasBlockedEvidence: false,
};

describe('source-governance gate (config + boot)', () => {
  it('loads with no attestation by default (SOURCE_NEEDED)', () => {
    expect(loadRulesetAttestation(loadConfig(base)).status).toBe('SOURCE_NEEDED');
  });

  it('fails boot when the attestation content hash does not match the pin', () => {
    const config = loadConfig({ ...attestedEnv, RULESET_ATTESTATION_SHA256: 'f'.repeat(64) });
    expect(() => createApp(config)).toThrow(/hash/i);
  });

  it('loads an ATTESTED attestation with a valid pin', () => {
    expect(attested.status).toBe('ATTESTED');
  });
});

describe('source-governance elevation (fail-closed guard)', () => {
  it('elevates to SOURCE_REVIEWED only with a valid attestation + exact hash match', () => {
    const verdict = verifyRulesetGovernance(okCtx, attested);
    expect(verdict.elevated).toBe(true);
    expect(verdict.sourceStatus).toBe('SOURCE_REVIEWED');
    expect(verdict.reviewer?.name).toBeTruthy();
  });

  it('does NOT elevate with no attestation', () => {
    expect(verifyRulesetGovernance(okCtx, noAttestation).elevated).toBe(false);
  });

  it('does NOT elevate on a ruleset-hash mismatch (governanceStatus MISMATCH)', () => {
    const verdict = verifyRulesetGovernance({ ...okCtx, rulesetSha256: 'a'.repeat(64) }, attested);
    expect(verdict.elevated).toBe(false);
    expect(verdict.governanceStatus).toBe('MISMATCH');
    expect(verdict.sourceStatus).toBe('SOURCE_NEEDED');
  });

  it('does NOT elevate when the live ruleset hash is absent', () => {
    expect(verifyRulesetGovernance({ ...okCtx, rulesetSha256: null }, attested).elevated).toBe(false);
  });

  it('does NOT elevate on ruleset id or version mismatch', () => {
    expect(verifyRulesetGovernance({ ...okCtx, rulesetId: 'other.ruleset' }, attested).elevated).toBe(false);
    expect(verifyRulesetGovernance({ ...okCtx, rulesetVersion: '9.9.9' }, attested).elevated).toBe(false);
  });

  it('does NOT elevate over blocked evidence or a MISMATCH crosscheck', () => {
    expect(verifyRulesetGovernance({ ...okCtx, hasBlockedEvidence: true }, attested).elevated).toBe(false);
    expect(verifyRulesetGovernance({ ...okCtx, crosscheckStatus: 'MISMATCH' }, attested).elevated).toBe(false);
  });

  it('never elevates over a non-SOURCE_NEEDED raw status — BLOCKED stays BLOCKED', () => {
    const verdict = verifyRulesetGovernance({ ...okCtx, rawSourceStatus: 'BLOCKED' }, attested);
    expect(verdict.elevated).toBe(false);
    expect(verdict.sourceStatus).toBe('BLOCKED');
  });
});

describe('source-governance end-to-end through the app', () => {
  it('default app leaves the chart SOURCE_NEEDED / not-authoritative', async () => {
    const app = createApp(loadConfig(base));
    const config = await request(app).get('/api/config-status');
    expect(config.body.rulesetGovernance).toBe('SOURCE_NEEDED');
    const report = normalizeRaw(raw, 'fixture', loadRulesetAttestation(loadConfig(base)));
    expect(report.calculation.sourceStatus).toBe('SOURCE_NEEDED');
    expect(report.sourceGovernance.elevated).toBe(false);
  });

  it('attested app elevates the matching chart to SOURCE_REVIEWED with a named reviewer', async () => {
    const app = createApp(loadConfig(attestedEnv));
    const config = await request(app).get('/api/config-status');
    expect(config.body.rulesetGovernance).toBe('ATTESTED');

    const report = normalizeRaw(raw, 'fixture', attested);
    expect(report.calculation.sourceStatus).toBe('SOURCE_REVIEWED');
    expect(report.sourceGovernance.reviewer.name).toBeTruthy();

    const rulesetStatus = await request(app).get('/api/zwds/ruleset-status?rulesetId=zwds.fufire.core-seed.v1');
    expect(rulesetStatus.body.status).toBe('active');
    expect(rulesetStatus.body.sourceStatus).toBe('SOURCE_REVIEWED');
    expect(rulesetStatus.body.governance.reviewedBy.name).toBeTruthy();
  });
});
