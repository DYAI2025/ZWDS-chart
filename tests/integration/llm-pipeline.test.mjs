import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import request from 'supertest';
import { createApp, loadConfig } from '../../server/index.mjs';
import { normalizeRaw, generateSections } from '../../server/normalize.mjs';
import { loadReviewedCorpus } from '../../server/llm/corpus.mjs';
import { interpretSections } from '../../server/llm/interpret.mjs';
import { validateSynthesis, SynthesisRejected } from '../../server/llm/validate.mjs';

// REQ-015 — fail-closed LLM interpretation pipeline. These tests prove the pipeline is built
// AND that it cannot ship ungrounded prose: the gate refuses to enable without a validated,
// hash-pinned reviewed corpus, and the grounding guard rejects any synthesized claim that is
// not anchored to a supplied rule + the section's own evidence, falling back to deterministic.

const CORPUS_PATH = 'tests/fixtures/llm/reviewed-corpus.test.json';
const CORPUS_SHA = 'a9fe673635a8de71a51dab0989bbcc0debf0afd62c75fb9ee408b65e0b9ebdde';
const base = { FUFIRE_MODE: 'fixture', NODE_ENV: 'test', PORT: '0', RULESET_ID: 'zwds.fufire.core-seed.v1' };
const enabledEnv = {
  ...base,
  LLM_ENABLED: 'true',
  LLM_CORPUS_STATUS: 'SOURCE_REVIEWED',
  LLM_CORPUS_PATH: CORPUS_PATH,
  LLM_CORPUS_SHA256: CORPUS_SHA,
  LLM_API_KEY: 'test-key-not-real',
};

const report = normalizeRaw(JSON.parse(fs.readFileSync('tests/fixtures/fufire/zwds-core-seed-shanghai-1984.json', 'utf8')));
const sections = generateSections(report).sections;
const corpus = loadReviewedCorpus(loadConfig(enabledEnv));
// A section whose ruleType has reviewed guidance (so the LLM path applies to it).
const target = sections.find((section) => corpus.rulesByKey.has(section.ruleType));
const sectionIndex = new Map(sections.map((section) => [section.sectionId, section]));
const allEvidence = new Set(sections.flatMap((section) => section.evidenceIds));

// Asserts validateSynthesis rejects with a specific SynthesisRejected .code (precise —
// does not depend on human-readable message wording).
function expectRejectCode(run, code) {
  let thrown;
  try { run(); } catch (error) { thrown = error; }
  expect(thrown, 'expected a SynthesisRejected to be thrown').toBeInstanceOf(SynthesisRejected);
  expect(thrown.code).toBe(code);
}

const fakeClient = (responseObj) => ({ complete: async () => JSON.stringify(responseObj) });
const groundedFor = (section) => ({
  sections: [{ sectionId: section.sectionId, prose: 'Grounded test prose.', citations: [{ ruleKey: section.ruleType, evidenceIds: section.evidenceIds }] }],
});

describe('REQ-015 fail-closed gate (config + boot)', () => {
  it('refuses to enable the LLM with no reviewed corpus at all', () => {
    expect(() => loadConfig({ ...base, LLM_ENABLED: 'true' })).toThrow();
  });

  it('refuses to enable when SOURCE_REVIEWED is declared but path/sha/key are missing', () => {
    expect(() => loadConfig({ ...base, LLM_ENABLED: 'true', LLM_CORPUS_STATUS: 'SOURCE_REVIEWED' })).toThrow();
  });

  it('fails boot when the corpus content hash does not match the pin', () => {
    const config = loadConfig({ ...enabledEnv, LLM_CORPUS_SHA256: 'f'.repeat(64) });
    expect(() => createApp(config)).toThrow(/hash/i);
  });

  it('boots and reports llmConfigured:true only with a valid, hash-pinned corpus', async () => {
    const app = createApp(loadConfig(enabledEnv));
    const response = await request(app).get('/api/config-status');
    expect(response.body).toMatchObject({ llmConfigured: true, llmCorpusStatus: 'SOURCE_REVIEWED' });
  });
});

describe('REQ-015 default stays fail-closed', () => {
  it('keeps the LLM off and deterministic by default', async () => {
    const app = createApp(loadConfig(base));
    const response = await request(app).get('/api/config-status');
    expect(response.body).toMatchObject({ llmConfigured: false, llmCorpusStatus: 'SOURCE_NEEDED' });
  });
});

describe('REQ-015 grounded synthesis + hallucination guard', () => {
  it('has a target section with reviewed guidance to exercise', () => {
    expect(target, 'fixture must produce at least one section with corpus guidance').toBeTruthy();
  });

  it('accepts grounded output and replaces that section with cited LLM prose', async () => {
    const out = await interpretSections(sections, { corpus, client: fakeClient(groundedFor(target)), locale: 'en-US' });
    expect(out.llmUsed).toBe(true);
    const synthesized = out.sections.find((section) => section.sectionId === target.sectionId);
    expect(synthesized.prose).toBe('Grounded test prose.');
    expect(synthesized.truthClass).toBe('LLM_SYNTHESIZED');
    expect(synthesized.sourceStatus).toBe('SOURCE_REVIEWED');
    // Sections without guidance stay deterministic (no prose leaked onto them).
    const untouched = out.sections.filter((section) => !corpus.rulesByKey.has(section.ruleType));
    for (const section of untouched) expect(section.prose).toBeUndefined();
  });

  it('rejects and falls back to deterministic when the LLM cites unknown evidence', async () => {
    const out = await interpretSections(sections, {
      corpus,
      client: fakeClient({ sections: [{ sectionId: target.sectionId, prose: 'Fabricated.', citations: [{ ruleKey: target.ruleType, evidenceIds: ['evidence.DOES_NOT_EXIST'] }] }] }),
      locale: 'en-US',
    });
    expect(out.llmUsed).toBe(false);
    expect(out.sections.find((section) => section.sectionId === target.sectionId).prose).toBeUndefined();
  });

  it('rejects borrowing a valid evidence id that belongs to another section', () => {
    const other = sections.find((section) => section.sectionId !== target.sectionId && section.evidenceIds.some((id) => !target.evidenceIds.includes(id)));
    const borrowed = other.evidenceIds.find((id) => !target.evidenceIds.includes(id));
    expect(() => validateSynthesis(
      [{ sectionId: target.sectionId, prose: 'x', citations: [{ ruleKey: target.ruleType, evidenceIds: [borrowed] }] }],
      { allowedRuleKeys: new Set([target.ruleType]), allowedEvidenceIds: allEvidence, sectionIndex },
    )).toThrow(SynthesisRejected);
  });

  it('rejects a citation to a rule not supplied for that section', () => {
    expectRejectCode(() => validateSynthesis(
      [{ sectionId: target.sectionId, prose: 'x', citations: [{ ruleKey: 'SOME_OTHER_RULE', evidenceIds: target.evidenceIds }] }],
      { allowedRuleKeys: new Set([target.ruleType]), allowedEvidenceIds: allEvidence, sectionIndex },
    ), 'LLM_CITATION_UNKNOWN_RULE');
  });

  it('rejects empty prose and uncited sections', () => {
    const ctx = { allowedRuleKeys: new Set([target.ruleType]), allowedEvidenceIds: allEvidence, sectionIndex };
    expectRejectCode(() => validateSynthesis([{ sectionId: target.sectionId, prose: '   ', citations: [{ ruleKey: target.ruleType, evidenceIds: target.evidenceIds }] }], ctx), 'LLM_SECTION_EMPTY');
    expectRejectCode(() => validateSynthesis([{ sectionId: target.sectionId, prose: 'x', citations: [] }], ctx), 'LLM_SECTION_UNCITED');
  });

  it('falls back when the model returns non-JSON', async () => {
    const out = await interpretSections(sections, { corpus, client: { complete: async () => 'not json at all' }, locale: 'en-US' });
    expect(out.llmUsed).toBe(false);
  });

  // Numeric containment: structurally-valid citations must not let a fabricated number,
  // year, percentage, or amount slip into the prose. The product is non-predictive.
  it('rejects fabricated numbers/years/amounts not present in the guidance (falls back)', async () => {
    const out = await interpretSections(sections, {
      corpus,
      client: fakeClient({ sections: [{ sectionId: target.sectionId, prose: 'A 92% chance you marry in 2027 and gain 2,400,000 yuan.', citations: [{ ruleKey: target.ruleType, evidenceIds: target.evidenceIds }] }] }),
      locale: 'en-US',
    });
    expect(out.llmUsed).toBe(false);
    expect(out.sections.find((section) => section.sectionId === target.sectionId).prose).toBeUndefined();
  });

  it('numeric containment rejects a prose number absent from guidance but allows one present in it', () => {
    const ctx = (guidance) => ({
      allowedRuleKeys: new Set([target.ruleType]),
      allowedEvidenceIds: allEvidence,
      sectionIndex,
      guidanceById: new Map([[target.sectionId, guidance]]),
    });
    const withNumber = [{ sectionId: target.sectionId, prose: 'It resonates for 42 years.', citations: [{ ruleKey: target.ruleType, evidenceIds: target.evidenceIds }] }];
    expectRejectCode(() => validateSynthesis(withNumber, ctx('Guidance without any figure.')), 'LLM_UNGROUNDED_NUMBER');
    // Same number, now genuinely present in the reviewed guidance -> allowed.
    expect(validateSynthesis(withNumber, ctx('Guidance that itself references a 42-year window.'))[0].prose).toContain('42');
  });
});
