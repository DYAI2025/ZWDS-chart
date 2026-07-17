// ── Canonical FuFirE IDs ──────────────────────────────────
// UI aliases live ONLY in the catalogue; never replace domain IDs.

export const PALACE_IDS = [
  'MING', 'XIONG_DI', 'FU_QI', 'ZI_NU',
  'CAI_BO', 'JI_E', 'QIAN_YI', 'JIAO_YOU',
  'GUAN_LU', 'TIAN_ZHAI', 'FU_DE', 'FU_MU',
] as const;
export type PalaceId = (typeof PALACE_IDS)[number];

export const MAJOR_STAR_IDS = [
  'ZI_WEI', 'TIAN_JI', 'TAI_YANG', 'WU_QU',
  'TIAN_TONG', 'LIAN_ZHEN', 'TIAN_FU', 'TAI_YIN',
  'TAN_LANG', 'JU_MEN', 'TIAN_XIANG', 'TIAN_LIANG',
  'QI_SHA', 'PO_JUN',
] as const;

// Approved auxiliary stars only (fixture scope). ZUO_FU/WEN_QU are part of the
// real FuFirE GUIDE_AUX_4 family (star_catalog core-seed.18) alongside YOU_BI/WEN_CHANG.
export const AUX_STAR_IDS = ['ZUO_FU', 'WEN_QU', 'YOU_BI', 'WEN_CHANG'] as const;

export const STAR_IDS = [...MAJOR_STAR_IDS, ...AUX_STAR_IDS] as const;
export type StarId = (typeof STAR_IDS)[number];

// Canonical transformation IDs — the REAL FuFirE spelling is HUA_QUAN (化權). The earlier
// shortened alias form was fabricated and is not emitted by the engine (banned in the arch gates).
export const TRANSFORMATION_IDS = ['HUA_LU', 'HUA_QUAN', 'HUA_KE', 'HUA_JI'] as const;
export type TransformationId = (typeof TRANSFORMATION_IDS)[number];

export const BUREAU_IDS = ['WATER_2', 'WOOD_3', 'METAL_4', 'EARTH_5', 'FIRE_6'] as const;
export type BureauId = (typeof BUREAU_IDS)[number];

export const BRANCH_IDS = ['ZI', 'CHOU', 'YIN', 'MAO', 'CHEN', 'SI', 'WU', 'WEI', 'SHEN', 'YOU', 'XU', 'HAI'] as const;
export type BranchId = (typeof BRANCH_IDS)[number];

// Earthly animals are a SEPARATE data type from branches.
export const ANIMAL_IDS = ['RAT', 'OX', 'TIGER', 'RABBIT', 'DRAGON', 'SNAKE', 'HORSE', 'GOAT', 'MONKEY', 'ROOSTER', 'DOG', 'PIG'] as const;
export type AnimalId = (typeof ANIMAL_IDS)[number];

export const STEM_IDS = ['JIA', 'YI', 'BING', 'DING', 'WU', 'JI', 'GENG', 'XIN', 'REN', 'GUI'] as const;
export type StemId = (typeof STEM_IDS)[number];

// ── Unified status / truth values ─────────────────────────
export type SourceStatus = 'SOURCE_REVIEWED' | 'SOURCE_NEEDED' | 'BLOCKED';

export type ScriptVariant = 'zh-Hant' | 'zh-Hans';
export type ScriptPolicy = 'TW_TRADITIONAL';
export type Locale = 'de-DE' | 'en-US';

export type CalculationStatus = 'SUCCESS' | 'DEMO_FIXTURE' | 'ERROR';
export type CrosscheckStatus = 'MATCHED' | 'SOURCE_NEEDED' | 'MISMATCH';
export type SchoolProfileStatus = 'NOT_SELECTED' | 'SELECTED';

// ── Browser DTO (v2, matches BFF contract) ────────────────
export interface ConfirmedLocation {
  lat: number;
  lon: number;
  timezone: string;
  displayName: string;
  confirmed: true;
}

export type DirectionMethod = 'year_stem_yinyang_and_sex' | 'explicit' | 'omit';
export type FlowDirection = 'forward' | 'backward';

export interface ZwdsBirthInput {
  date: string;
  time: string;
  placeQuery: string;
  location: ConfirmedLocation | null;
  sexAtBirth?: 'male' | 'female';
  directionMethod: DirectionMethod;
  flowDirection?: FlowDirection;
  locale: Locale;
  scriptVariant: ScriptVariant;
  includeDecadalLimits: boolean;
  interpret: boolean;
  privacyConsent: boolean;
}

// ── Normalized model v1 ───────────────────────────────────
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth?: boolean;
}

export interface NormalizedPalace {
  palaceId: PalaceId;          // palace ROLE, unique
  branchId: BranchId;
  stemId: StemId;
  // Placement truth comes from FuFirE chart.star_placements[].
  placementIds: string[];
  isMing: boolean;
  isShen: boolean;
  decadeIndex?: number;
}

export interface NormalizedStarPlacement {
  placementId: string;
  starId: StarId;
  palaceId: PalaceId;
  branchId: BranchId;
  transformationTypes: TransformationId[];
  sourceStatus: SourceStatus;
  provenanceIds: string[];
}

export interface NormalizedTransformation {
  transformationId: TransformationId;
  placementId: string;
  starId: StarId;
  palaceId: PalaceId;
  sourceStatus: SourceStatus;
}

export type RelationType = 'SQUARE_HARMONY' | 'OPPOSITION';

export interface NormalizedRelation {
  relationId: string;
  type: RelationType;
  palaceIds: PalaceId[];
  sourceStatus: SourceStatus;
}

export interface NormalizedDecade {
  index: number;
  ageStart: number;
  ageEnd: number;
  palaceId: PalaceId;
  sourceStatus: SourceStatus;
}

export interface NormalizedQuality {
  sourceStatus: SourceStatus;
  humanReviewRequired: boolean;
  warnings: Array<{
    code: string;
    message: string;
    evidenceIds: string[];
  }>;
}

export interface ProvenanceRecord {
  recordId: string;
  dataId: string;
  origin: string;
  timestamp: string;
  sourceStatus: SourceStatus;
  fieldPath?: string;
  sourceId?: string;
}

export interface EvidenceEntry {
  evidenceId: string;
  type: string;
  value: unknown;
  sourceStatus: SourceStatus;
  provenanceId?: string;
}

export interface NormalizedZwdsReport {
  schemaVersion: 'fufire.zwds-evidence.v1';
  calculation: {
    calculationStatus: CalculationStatus;
    crosscheckStatus: CrosscheckStatus;
    requestId: string;
    engineVersion: string;
    generatedAt: string;
    chartFingerprint: string;
    rulesetId: string;
    rulesetVersion: string;
    rulesetSha256: string | null;
    schoolLabel: string | null;
    calendarPolicyId: string | null;
    calendarPolicySha256: string | null;
    timePolicyId: string | null;
    timePolicySha256: string | null;
    leapMonthPolicyId: string | null;
    yearCyclePolicyId: string | null;
    starCatalogId: string | null;
    starCatalogSha256: string | null;
    transformationTableId: string | null;
    transformationTableSha256: string | null;
    ageReckoningId: string | null;
    sourceStatus: SourceStatus;
    humanReviewRequired: boolean;
    dataMode: 'live' | 'fixture';
  };
  birthInputSummary: {
    date: string;
    time: string;
    locationDisplayName: string;
    timezone: string;
    sexAtBirth?: 'male' | 'female';
    directionMethod: DirectionMethod;
    includeDecadalLimits: boolean;
  };
  birthResolution: {
    civilLocal: string;
    effectiveLocal: string;
    lunarDateBeforeLateZi: LunarDate;
    chartLunarDate: LunarDate;
    lateZiApplied: boolean;
    hourBranchId: BranchId;
  };
  anchors: {
    mingBranchId: BranchId;
    shenBranchId: BranchId;
    samePalace: boolean;
    bureauId: BureauId;
    bureauNumber: 2 | 3 | 4 | 5 | 6;
  };
  palaces: NormalizedPalace[];
  stars: NormalizedStarPlacement[];
  transformations: NormalizedTransformation[];
  relations: NormalizedRelation[];
  decades: NormalizedDecade[] | null;
  quality: NormalizedQuality;
  provenance: ProvenanceRecord[];
  evidenceIndex: EvidenceEntry[];
  derivationTrace: unknown[] | null;
  scriptPolicy: ScriptPolicy;
  schoolProfileStatus: SchoolProfileStatus;
}

// ── Interpretation section (deterministic engine output) ──
import type { TruthClass } from './truthTypes';

export interface ReportSection {
  sectionId: string;
  ruleId: string;
  ruleVersion: string;
  ruleType:
    | 'STAR_IN_PALACE'
    | 'STAR_WITH_TRANSFORMATION'
    | 'MULTIPLE_STARS_IN_PALACE'
    | 'MING_SHEN_COLOCATED'
    | 'NO_CORE_STAR_IN_MING'
    | 'PALACE_NETWORK'
    | 'DECADE_ACTIVATES_PALACE'
    | 'SOURCE_LIMITS';
  relatedPalaceId?: PalaceId;
  relatedStarId?: StarId;
  relatedTransformationId?: TransformationId;
  decadeIndex?: number;
  truthClass: TruthClass;
  evidenceIds: string[];
  localeTextKey: string; // localization key; params resolved client-side
  textParams?: Record<string, string>;
  limitations: string[];
  sourceStatus: SourceStatus;
}

export interface PalaceRelations {
  harmony: PalaceId[];
  opposition: PalaceId | null;
}

/**
 * Resolves the harmony (SQUARE_HARMONY) and opposition palaces related to `palaceId`
 * from the calculated relation set. Shared by the atlas grid, the relation summary and
 * the aria-live announcement so all three describe the SAME calculated relationships
 * (REQ-016B / REQ-008 — the live region must announce relations, not just the name).
 */
export function relatedPalaces(
  report: NormalizedZwdsReport,
  palaceId: PalaceId | null
): PalaceRelations {
  if (!palaceId) return { harmony: [], opposition: null };
  const harmony = report.relations.find(
    (relation) => relation.type === 'SQUARE_HARMONY' && relation.palaceIds.includes(palaceId)
  );
  const opposition = report.relations.find(
    (relation) => relation.type === 'OPPOSITION' && relation.palaceIds.includes(palaceId)
  );
  return {
    harmony: harmony?.palaceIds.filter((id) => id !== palaceId) ?? [],
    opposition: opposition?.palaceIds.find((id) => id !== palaceId) ?? null,
  };
}

export function placementsForPalace(
  report: NormalizedZwdsReport,
  palaceId: PalaceId
): NormalizedStarPlacement[] {
  const palace = report.palaces.find((item) => item.palaceId === palaceId);
  if (!palace) return [];
  const byId = new Map(report.stars.map((placement) => [placement.placementId, placement]));
  return palace.placementIds.flatMap((placementId) => {
    const placement = byId.get(placementId);
    return placement ? [placement] : [];
  });
}

export interface ZwdsDataProvider {
  geocode(query: string, language: 'de' | 'en', options?: { signal?: AbortSignal }): Promise<GeocodeResult[]>;
  calculate(input: ZwdsBirthInput, options?: { signal?: AbortSignal }): Promise<ZwdsCalculationResult>;
  interpret(report: NormalizedZwdsReport, locale: Locale, options?: { signal?: AbortSignal }): Promise<ReportSection[]>;
  getRulesetStatus(rulesetId: string, options?: { signal?: AbortSignal }): Promise<{ rulesetId: string; status: string; displayVersion: string }>;
  createPdf?(reportToken: string, locale: Locale, options?: { signal?: AbortSignal }): Promise<Blob>;
  readonly mode: 'fixture' | 'bff';
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
  timezone: string;
  providerId: string;
  confidence: number | null;
}

export interface ZwdsCalculationResult {
  report: NormalizedZwdsReport;
  sections: ReportSection[];
  reportToken: string | null;
}
