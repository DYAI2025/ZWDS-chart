import { describe, it, expect } from 'vitest';
import { en } from '@/data/localization/en';
import { de } from '@/data/localization/de';

// Red-team the Guided copy (docs/language-guide.md "Verbotene Formulierungen"): no guarantee,
// prediction-as-fact, or destiny claim may appear in any user-facing guided.* string. The
// disclaimers intentionally NAME what is excluded ("not a … destiny prediction"), so the
// banned list targets POSITIVE claim phrasings that must never occur, not the negated nouns.
const BANNED: RegExp[] = [
  /\bguarantee(d|s)?\b/i,
  /\byou will\b/i,
  /\bwill come true\b/i,
  /\byour destiny\b/i,
  /\bpredetermined\b/i,
  /\bgarantiert\b/i,
  /\bvorbestimmt\b/i,
  /\bdu wirst\b/i,
  /\bdein schicksal\b/i,
];

function guidedEntries(dict: Record<string, string>): [string, string][] {
  return Object.entries(dict).filter(([key]) => key.startsWith('guided.'));
}

describe('Guided content safety (red-team over localization)', () => {
  for (const [langName, dict] of [['en', en], ['de', de]] as const) {
    it(`${langName}: no guided.* string makes a guarantee/destiny/prediction-as-fact claim`, () => {
      for (const [key, value] of guidedEntries(dict)) {
        for (const pattern of BANNED) {
          expect(pattern.test(value), `${langName} ${key} = "${value}"`).toBe(false);
        }
      }
    });
  }

  it('the critical non-verdict safety line is present in both languages', () => {
    expect(en['guided.notVerdict']).toMatch(/does not automatically mean good or bad/i);
    expect(de['guided.notVerdict']).toMatch(/nicht automatisch gut oder schlecht/i);
  });

  it('every guided.* key exists in both languages (no missing translation)', () => {
    const enKeys = Object.keys(en).filter((k) => k.startsWith('guided.') || k === 'nav.guided');
    for (const key of enKeys) expect(de[key], `missing de key ${key}`).toBeTruthy();
  });
});
