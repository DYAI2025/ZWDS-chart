// ── BaZodiac ZWDS Catalogue ───────────────────────────────
// Version: 0.2.0 — canonical FuFirE IDs
// Region policy: TW_TRADITIONAL (zh-Hant)
// Incomplete by design: unknown lookups must degrade to SOURCE_NEEDED.

import type { SourceStatus } from '@/domain/zwdsTypes';

export const CATALOG_ID = 'bazodiac.zwds.tw-traditional';
export const CATALOG_VERSION = '0.3.0';
// The supplied source set does not include a reviewed catalogue digest.
// A build-time architecture test computes the content digest; it is not
// presented as reviewed domain metadata until externally approved.
export const CATALOG_SHA256: string | null = null;
export const REGION_POLICY = 'TW_TRADITIONAL' as const;

export interface CatalogueEntry {
  id: string;
  stableId: string;
  hanzi: string;
  pinyin: string; // with tone marks
  pinyinWithToneMarks: string;
  de: string;
  en: string;
  traditionalAliases: string[];
  entityType: 'PALACE' | 'STAR' | 'TRANSFORMATION' | 'BUREAU' | 'BRANCH' | 'ANIMAL' | 'STEM' | 'CONCEPT';
  animalId?: string; // branches only: SEPARATE field, never the ID
  sourceId: string;
  sourceStatus: SourceStatus;
  regionPolicy: typeof REGION_POLICY;
}

const SRC_PRIMARY = 'fufire.core-seed.v1';
const SRC_BAZODIAC = 'bazodiac.catalog-review';

type EntryInput = Omit<CatalogueEntry, 'regionPolicy' | 'stableId' | 'pinyinWithToneMarks' | 'traditionalAliases' | 'entityType'> & {
  traditionalAliases?: string[];
  entityType?: CatalogueEntry['entityType'];
};

function entityTypeFor(id: string): CatalogueEntry['entityType'] {
  if (['MING','XIONG_DI','FU_QI','ZI_NU','CAI_BO','JI_E','QIAN_YI','JIAO_YOU','GUAN_LU','TIAN_ZHAI','FU_DE','FU_MU'].includes(id)) return 'PALACE';
  if (id.startsWith('HUA_')) return 'TRANSFORMATION';
  if (['WATER_2','WOOD_3','METAL_4','EARTH_5','FIRE_6'].includes(id)) return 'BUREAU';
  if (['ZI','CHOU','YIN','MAO','CHEN','SI','WU_BRANCH','WEI','SHEN','YOU','XU','HAI'].includes(id)) return 'BRANCH';
  if (['RAT','OX','TIGER','RABBIT','DRAGON','SNAKE','HORSE','GOAT','MONKEY','ROOSTER','DOG','PIG'].includes(id)) return 'ANIMAL';
  if (['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'].includes(id)) return 'STEM';
  if (id.startsWith('CONCEPT_')) return 'CONCEPT';
  return 'STAR';
}

function entry(partial: EntryInput): CatalogueEntry {
  return {
    ...partial,
    stableId: partial.id,
    pinyinWithToneMarks: partial.pinyin,
    traditionalAliases: partial.traditionalAliases ?? [],
    entityType: partial.entityType ?? entityTypeFor(partial.id),
    regionPolicy: REGION_POLICY,
  };
}

// ── 12 Palaces ────────────────────────────────────────────
export const PALACE_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'MING', hanzi: '命宮', pinyin: 'mìng gōng', de: 'Lebenspalast', en: 'Life Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'XIONG_DI', hanzi: '兄弟宮', pinyin: 'xiōngdì gōng', de: 'Geschwisterpalast', en: 'Siblings Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'FU_QI', hanzi: '夫妻宮', pinyin: 'fūqī gōng', de: 'Partnerpalast', en: 'Spouse Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'ZI_NU', hanzi: '子女宮', pinyin: 'zǐnǚ gōng', de: 'Kinderpalast', en: 'Children Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'CAI_BO', hanzi: '財帛宮', pinyin: 'cáibó gōng', de: 'Vermögenspalast', en: 'Wealth Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'JI_E', hanzi: '疾厄宮', pinyin: 'jíè gōng', de: 'Körper- und Belastungspalast', en: 'Health Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'QIAN_YI', hanzi: '遷移宮', pinyin: 'qiānyí gōng', de: 'Bewegungspalast', en: 'Travel Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'JIAO_YOU', hanzi: '交友宮', pinyin: 'jiāoyǒu gōng', de: 'Freundespalast', en: 'Friends Palace', traditionalAliases: ['僕役宮'], sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'GUAN_LU', hanzi: '官祿宮', pinyin: 'guānlù gōng', de: 'Wirkungspalast', en: 'Career Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_ZHAI', hanzi: '田宅宮', pinyin: 'tiánzhái gōng', de: 'Besitzpalast', en: 'Property Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'FU_DE', hanzi: '福德宮', pinyin: 'fúdé gōng', de: 'Innere-Haltung-Palast', en: 'Fortune Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'FU_MU', hanzi: '父母宮', pinyin: 'fùmǔ gōng', de: 'Elternpalast', en: 'Parents Palace', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
];

// ── 14 Major Stars ────────────────────────────────────────
export const STAR_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'ZI_WEI', hanzi: '紫微', pinyin: 'zǐwēi', de: 'Kaiserstern', en: 'Emperor Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_JI', hanzi: '天機', pinyin: 'tiānjī', de: 'Stern der Fugung', en: 'Celestial Mechanism', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TAI_YANG', hanzi: '太陽', pinyin: 'tàiyáng', de: 'Sonnenstern', en: 'Sun Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'WU_QU', hanzi: '武曲', pinyin: 'wǔqǔ', de: 'Stern der Durchsetzung', en: 'Martial Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_TONG', hanzi: '天同', pinyin: 'tiāntóng', de: 'Stern der Gemeinsamkeit', en: 'Celestial Harmony', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'LIAN_ZHEN', hanzi: '廉貞', pinyin: 'liánzhēn', de: 'Stern der Rechtschaffenheit', en: 'Upright Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_FU', hanzi: '天府', pinyin: 'tiānfǔ', de: 'Stern des Speichers', en: 'Treasury Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TAI_YIN', hanzi: '太陰', pinyin: 'tàiyīn', de: 'Mondstern', en: 'Moon Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TAN_LANG', hanzi: '貪狼', pinyin: 'tānláng', de: 'Stern des Begehrens', en: 'Desiring Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'JU_MEN', hanzi: '巨門', pinyin: 'jùmén', de: 'Stern des Tores', en: 'Gate Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_XIANG', hanzi: '天相', pinyin: 'tiānxiàng', de: 'Stern des Ministers', en: 'Minister Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'TIAN_LIANG', hanzi: '天梁', pinyin: 'tiānliáng', de: 'Stern des Balkens', en: 'Beam Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'QI_SHA', hanzi: '七殺', pinyin: 'qīshā', de: 'Stern der Schneide', en: 'Seven Kills Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'PO_JUN', hanzi: '破軍', pinyin: 'pòjūn', de: 'Stern des Aufbruchs', en: 'Breaker Star', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
];

// ── Approved auxiliary stars (fixture scope) ──────────────
export const AUX_STAR_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'ZUO_FU', hanzi: '左輔', pinyin: 'zuǒfǔ', de: 'Linke Stütze', en: 'Left Support', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'WEN_QU', hanzi: '文曲', pinyin: 'wénqǔ', de: 'Stern der Wortkunst', en: 'Wen Qu Star', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'YOU_BI', hanzi: '右弼', pinyin: 'yòubì', de: 'Rechte Stütze', en: 'Right Support', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'WEN_CHANG', hanzi: '文昌', pinyin: 'wénchāng', de: 'Literarischer Glanz', en: 'Literary Brilliance', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
];

export const FULL_STAR_CATALOGUE: CatalogueEntry[] = [...STAR_CATALOGUE, ...AUX_STAR_CATALOGUE];

// ── Four Transformations (canonical IDs) ──────────────────
export const TRANSFORMATION_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'HUA_LU', hanzi: '化祿', pinyin: 'huàlù', de: 'Wandlung des Flusses', en: 'Lu Transformation', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'HUA_QUAN', hanzi: '化權', pinyin: 'huàquán', de: 'Wandlung der Handlungsmacht', en: 'Quan Transformation', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'HUA_KE', hanzi: '化科', pinyin: 'huàkē', de: 'Wandlung der Sichtbarkeit', en: 'Ke Transformation', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'HUA_JI', hanzi: '化忌', pinyin: 'huàjì', de: 'Wandlung der Reibung', en: 'Ji Transformation', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
];

// ── Five Elements Bureau ──────────────────────────────────
export const BUREAU_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'WATER_2', hanzi: '水二局', pinyin: 'shuǐ èr jú', de: 'Wasser-Zwei-Büro', en: 'Water Two Bureau', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'WOOD_3', hanzi: '木三局', pinyin: 'mù sān jú', de: 'Holz-Drei-Büro', en: 'Wood Three Bureau', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'METAL_4', hanzi: '金四局', pinyin: 'jīn sì jú', de: 'Metall-Vier-Büro', en: 'Metal Four Bureau', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'EARTH_5', hanzi: '土五局', pinyin: 'tǔ wǔ jú', de: 'Erde-Fünf-Büro', en: 'Earth Five Bureau', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'FIRE_6', hanzi: '火六局', pinyin: 'huǒ liù jú', de: 'Feuer-Sechs-Büro', en: 'Fire Six Bureau', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_NEEDED' }),
];

// ── 12 Earthly Branches — animals are a SEPARATE field ────
export const BRANCH_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'ZI', hanzi: '子', pinyin: 'zǐ', de: 'Zweig Zi', en: 'Branch Zi', animalId: 'RAT', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'CHOU', hanzi: '丑', pinyin: 'chǒu', de: 'Zweig Chou', en: 'Branch Chou', animalId: 'OX', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'YIN', hanzi: '寅', pinyin: 'yín', de: 'Zweig Yin', en: 'Branch Yin', animalId: 'TIGER', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'MAO', hanzi: '卯', pinyin: 'mǎo', de: 'Zweig Mao', en: 'Branch Mao', animalId: 'RABBIT', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'CHEN', hanzi: '辰', pinyin: 'chén', de: 'Zweig Chen', en: 'Branch Chen', animalId: 'DRAGON', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'SI', hanzi: '巳', pinyin: 'sì', de: 'Zweig Si', en: 'Branch Si', animalId: 'SNAKE', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'WU', hanzi: '午', pinyin: 'wǔ', de: 'Zweig Wu', en: 'Branch Wu', animalId: 'HORSE', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED', entityType: 'BRANCH' }),
  entry({ id: 'WEI', hanzi: '未', pinyin: 'wèi', de: 'Zweig Wei', en: 'Branch Wei', animalId: 'GOAT', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'SHEN', hanzi: '申', pinyin: 'shēn', de: 'Zweig Shen', en: 'Branch Shen', animalId: 'MONKEY', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'YOU', hanzi: '酉', pinyin: 'yǒu', de: 'Zweig You', en: 'Branch You', animalId: 'ROOSTER', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'XU', hanzi: '戌', pinyin: 'xū', de: 'Zweig Xu', en: 'Branch Xu', animalId: 'DOG', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'HAI', hanzi: '亥', pinyin: 'hài', de: 'Zweig Hai', en: 'Branch Hai', animalId: 'PIG', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
];

// ── Zodiac animals: own entity type, decoupled from branch ─
export const ANIMAL_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'RAT', hanzi: '鼠', pinyin: 'shǔ', de: 'Ratte', en: 'Rat', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'OX', hanzi: '牛', pinyin: 'niú', de: 'Ochse', en: 'Ox', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'TIGER', hanzi: '虎', pinyin: 'hǔ', de: 'Tiger', en: 'Tiger', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'RABBIT', hanzi: '兔', pinyin: 'tù', de: 'Hase', en: 'Rabbit', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'DRAGON', hanzi: '龍', pinyin: 'lóng', de: 'Drache', en: 'Dragon', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'SNAKE', hanzi: '蛇', pinyin: 'shé', de: 'Schlange', en: 'Snake', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'HORSE', hanzi: '馬', pinyin: 'mǎ', de: 'Pferd', en: 'Horse', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'GOAT', hanzi: '羊', pinyin: 'yáng', de: 'Ziege', en: 'Goat', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'MONKEY', hanzi: '猴', pinyin: 'hóu', de: 'Affe', en: 'Monkey', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'ROOSTER', hanzi: '雞', pinyin: 'jī', de: 'Hahn', en: 'Rooster', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'DOG', hanzi: '狗', pinyin: 'gǒu', de: 'Hund', en: 'Dog', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
  entry({ id: 'PIG', hanzi: '豬', pinyin: 'zhū', de: 'Schwein', en: 'Pig', sourceId: SRC_BAZODIAC, sourceStatus: 'SOURCE_NEEDED' }),
];

// ── 10 Heavenly Stems ─────────────────────────────────────
export const STEM_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'JIA', hanzi: '甲', pinyin: 'jiǎ', de: 'Stamm Jia', en: 'Stem Jia', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'YI', hanzi: '乙', pinyin: 'yǐ', de: 'Stamm Yi', en: 'Stem Yi', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'BING', hanzi: '丙', pinyin: 'bǐng', de: 'Stamm Bing', en: 'Stem Bing', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'DING', hanzi: '丁', pinyin: 'dīng', de: 'Stamm Ding', en: 'Stem Ding', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'WU', hanzi: '戊', pinyin: 'wù', de: 'Stamm Wu', en: 'Stem Wu', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'JI', hanzi: '己', pinyin: 'jǐ', de: 'Stamm Ji', en: 'Stem Ji', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'GENG', hanzi: '庚', pinyin: 'gēng', de: 'Stamm Geng', en: 'Stem Geng', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'XIN', hanzi: '辛', pinyin: 'xīn', de: 'Stamm Xin', en: 'Stem Xin', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'REN', hanzi: '壬', pinyin: 'rén', de: 'Stamm Ren', en: 'Stem Ren', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'GUI', hanzi: '癸', pinyin: 'guǐ', de: 'Stamm Gui', en: 'Stem Gui', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
];

// ── Ming / Shen concepts ──────────────────────────────────
export const CONCEPT_CATALOGUE: CatalogueEntry[] = [
  entry({ id: 'CONCEPT_MING', hanzi: '命宮', pinyin: 'mìng gōng', de: 'Lebenspalast (Kernanker)', en: 'Life Palace anchor', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
  entry({ id: 'CONCEPT_SHEN', hanzi: '身宮', pinyin: 'shēn gōng', de: 'Körperpalast (Kernanker)', en: 'Body Palace anchor', sourceId: SRC_PRIMARY, sourceStatus: 'SOURCE_REVIEWED' }),
];

// ── Lookup helpers: unknown IDs degrade explicitly ────────
function lookup(catalogue: CatalogueEntry[], id: string): CatalogueEntry | null {
  return catalogue.find((e) => e.id === id) ?? null;
}

export const lookupPalace = (id: string) => lookup(PALACE_CATALOGUE, id);
export const lookupStar = (id: string) => lookup(FULL_STAR_CATALOGUE, id);
export const lookupTransformation = (id: string) => lookup(TRANSFORMATION_CATALOGUE, id);
export const lookupBureau = (id: string) => lookup(BUREAU_CATALOGUE, id);
export const lookupBranch = (id: string) => lookup(BRANCH_CATALOGUE, id);
export const lookupStem = (id: string) => lookup(STEM_CATALOGUE, id);
export const lookupAnimal = (id: string) => lookup(ANIMAL_CATALOGUE, id);

export function labelFor(entryLike: CatalogueEntry | null, lang: 'de' | 'en'): string | null {
  if (!entryLike) return null;
  return lang === 'de' ? entryLike.de : entryLike.en;
}

// ── Catalogue content digest + source-governance ───────────────────────────────
// Two distinct pins. CATALOG_CONTENT_SHA256 is the deterministic digest of the CURRENT
// catalogue content — a change-detection guard, not a review claim; a test recomputes it so
// silent drift fails the build. CATALOG_SHA256 (declared null above) is the REVIEWED digest a
// named catalogue reviewer would pin. The catalogue is authoritative (SOURCE_REVIEWED) ONLY
// when the reviewed pin exactly equals the content digest; with no reviewer it stays
// SOURCE_NEEDED. The reviewed digest is never fabricated.
export const FULL_CATALOGUE: CatalogueEntry[] = [
  ...PALACE_CATALOGUE, ...FULL_STAR_CATALOGUE, ...TRANSFORMATION_CATALOGUE,
  ...BRANCH_CATALOGUE, ...STEM_CATALOGUE, ...ANIMAL_CATALOGUE, ...BUREAU_CATALOGUE, ...CONCEPT_CATALOGUE,
];

// Deterministic, stable-ordered serialization — the input to the content digest. Any change to
// catalogue content (labels, ids, source status, version, region) changes this string.
export function canonicalCatalogueString(): string {
  const entries = FULL_CATALOGUE
    .map((e) => ({
      id: e.id, stableId: e.stableId, hanzi: e.hanzi, pinyin: e.pinyin, de: e.de, en: e.en,
      entityType: e.entityType, animalId: e.animalId ?? null, sourceId: e.sourceId,
      sourceStatus: e.sourceStatus, regionPolicy: e.regionPolicy, traditionalAliases: [...e.traditionalAliases],
    }))
    .sort((a, b) => {
      const ka = `${a.entityType}|${a.stableId}`;
      const kb = `${b.entityType}|${b.stableId}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  return JSON.stringify({ catalogId: CATALOG_ID, catalogVersion: CATALOG_VERSION, regionPolicy: REGION_POLICY, entries });
}

// The pinned sha256 of canonicalCatalogueString(). A test recomputes and asserts equality —
// silent catalogue drift fails the build. This is change-detection, NOT a reviewed claim.
export const CATALOG_CONTENT_SHA256 = 'fc61984024422566e6a900b202ff8a782b2ac1e9428e3f3fa6e534082f0c773d';

// Fail-closed catalogue authority: SOURCE_REVIEWED only when a reviewed digest is pinned AND it
// exactly equals the current content digest. A drifted / absent / mismatched reviewed pin =>
// SOURCE_NEEDED.
export function catalogueStatusFor(reviewedPin: string | null): SourceStatus {
  return reviewedPin !== null && reviewedPin === CATALOG_CONTENT_SHA256 ? 'SOURCE_REVIEWED' : 'SOURCE_NEEDED';
}
export function catalogueGovernanceStatus(): SourceStatus {
  return catalogueStatusFor(CATALOG_SHA256);
}
