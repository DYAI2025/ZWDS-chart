import { describe, it, expect } from 'vitest';
import {
  PALACE_CATALOGUE, FULL_STAR_CATALOGUE, TRANSFORMATION_CATALOGUE,
  BRANCH_CATALOGUE, STEM_CATALOGUE, ANIMAL_CATALOGUE, BUREAU_CATALOGUE,
  lookupPalace, lookupStar, CATALOG_ID, CATALOG_VERSION, CATALOG_SHA256,
} from '@/data/zwdsCatalog';
import { PALACE_IDS, MAJOR_STAR_IDS, STAR_IDS, TRANSFORMATION_IDS, BRANCH_IDS, STEM_IDS, ANIMAL_IDS } from '@/domain/zwdsTypes';

const TONE_MARKS = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const KANA_OR_HANGUL = /[぀-ヿ가-힯]/;

const ALL = [
  ...PALACE_CATALOGUE, ...FULL_STAR_CATALOGUE, ...TRANSFORMATION_CATALOGUE,
  ...BRANCH_CATALOGUE, ...STEM_CATALOGUE, ...ANIMAL_CATALOGUE, ...BUREAU_CATALOGUE,
];

describe('ZWDS catalogue policy', () => {
  it('catalogue IDs match canonical domain IDs exactly', () => {
    expect(PALACE_CATALOGUE.map((e) => e.id).sort()).toEqual([...PALACE_IDS].sort());
    expect(TRANSFORMATION_CATALOGUE.map((e) => e.id).sort()).toEqual([...TRANSFORMATION_IDS].sort());
    expect(BRANCH_CATALOGUE.map((e) => e.id).sort()).toEqual([...BRANCH_IDS].sort());
    expect(STEM_CATALOGUE.map((e) => e.id).sort()).toEqual([...STEM_IDS].sort());
    expect(ANIMAL_CATALOGUE.map((e) => e.id).sort()).toEqual([...ANIMAL_IDS].sort());
    for (const id of MAJOR_STAR_IDS) expect(lookupStar(id), id).not.toBeNull();
    // Full 18-star coverage: every canonical star id (14 major + 4 GUIDE_AUX_4, incl. the
    // real ZUO_FU/WEN_QU) must resolve in the catalogue so no placement renders as '?'.
    expect(STAR_IDS).toHaveLength(18);
    for (const id of STAR_IDS) expect(lookupStar(id), id).not.toBeNull();
    expect(lookupStar('ZUO_FU')?.hanzi).toBe('左輔');
    expect(lookupStar('WEN_QU')?.hanzi).toBe('文曲');
  });

  it('every pinyin contains at least one tone mark', () => {
    for (const e of ALL) {
      expect(TONE_MARKS.test(e.pinyin), `${e.id} pinyin "${e.pinyin}" lacks tone marks`).toBe(true);
    }
  });

  it('contains no kana or hangul characters anywhere', () => {
    for (const e of ALL) {
      expect(KANA_OR_HANGUL.test(e.hanzi)).toBe(false);
      expect(KANA_OR_HANGUL.test(e.pinyin)).toBe(false);
      expect(KANA_OR_HANGUL.test(e.de)).toBe(false);
      expect(KANA_OR_HANGUL.test(e.en)).toBe(false);
    }
  });

  it('keeps branches and animals as separate data types', () => {
    const animalIds = new Set(ANIMAL_IDS as readonly string[]);
    for (const b of BRANCH_CATALOGUE) {
      expect(animalIds.has(b.id), `branch ${b.id} collides with an animal ID`).toBe(false);
      expect(b.animalId).toBeDefined();
      expect(animalIds.has(b.animalId ?? ''), `branch ${b.id} references unknown animal`).toBe(true);
    }
  });

  it('stores traditional aliases as catalogue data, never as IDs', () => {
    const jiaoYou = lookupPalace('JIAO_YOU');
    expect(jiaoYou).not.toBeNull();
    expect(jiaoYou?.traditionalAliases).toContain('僕役宮');
    expect(lookupPalace('PU_YI')).toBeNull();
    expect(lookupPalace('ZI_NV')).toBeNull();
    expect(lookupPalace('ZI_NU')).not.toBeNull();
  });

  it('unknown lookups degrade to null (callers render SOURCE_NEEDED)', () => {
    expect(lookupStar('UNKNOWN_STAR')).toBeNull();
    expect(lookupPalace('NOT_A_PALACE')).toBeNull();
  });

  it('every entry carries source metadata and the region policy', () => {
    for (const e of ALL) {
      expect(e.regionPolicy).toBe('TW_TRADITIONAL');
      expect(e.sourceId.length).toBeGreaterThan(0);
      expect(['SOURCE_REVIEWED', 'SOURCE_NEEDED', 'BLOCKED']).toContain(e.sourceStatus);
      expect(e.stableId).toBe(e.id);
      expect(e.pinyinWithToneMarks).toBe(e.pinyin);
      expect(e.entityType).toBeTruthy();
    }
  });

  it('exposes versioned catalogue metadata without fabricating a reviewed digest', () => {
    expect(CATALOG_ID).toBe('bazodiac.zwds.tw-traditional');
    expect(CATALOG_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(CATALOG_SHA256).toBeNull();
  });
});
