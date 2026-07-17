import { z } from 'zod';

const PALACE_IDS = ['MING','XIONG_DI','FU_QI','ZI_NU','CAI_BO','JI_E','QIAN_YI','JIAO_YOU','GUAN_LU','TIAN_ZHAI','FU_DE','FU_MU'];
const STAR_IDS = ['ZI_WEI','TIAN_JI','TAI_YANG','WU_QU','TIAN_TONG','LIAN_ZHEN','TIAN_FU','TAI_YIN','TAN_LANG','JU_MEN','TIAN_XIANG','TIAN_LIANG','QI_SHA','PO_JUN','YOU_BI','WEN_CHANG'];
const TRANSFORMATION_IDS = ['HUA_LU','HUA_QU','HUA_KE','HUA_JI'];
const BRANCH_IDS = ['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'];
const STEM_IDS = ['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'];
const BUREAU_IDS = ['WATER_2','WOOD_3','METAL_4','EARTH_5','FIRE_6'];
const SOURCE_STATUSES = ['SOURCE_REVIEWED','SOURCE_NEEDED','BLOCKED'];
const RING = ['SI','WU','WEI','SHEN','YOU','XU','HAI','ZI','CHOU','YIN','MAO','CHEN'];

export class ContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
  }
}

const nullableId = z.string().min(1).nullable();
const nullableHash = z.string().regex(/^[a-f0-9]{64}$/i).nullable();
const sourceStatusSchema = z.enum(SOURCE_STATUSES);
const lunarDateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(30),
  is_leap_month: z.boolean().optional(),
}).strict();

export const rulesetMetadataSchema = z.object({
  ruleset_id: z.string().min(1),
  ruleset_version: z.string().min(1),
  ruleset_sha256: nullableHash,
  school_label: nullableId,
  calendar_policy_id: nullableId,
  calendar_policy_sha256: nullableHash,
  time_policy_id: nullableId,
  time_policy_sha256: nullableHash,
  leap_month_policy_id: nullableId,
  leap_month_policy_sha256: nullableHash,
  year_cycle_policy_id: nullableId,
  year_cycle_policy_sha256: nullableHash,
  star_catalog_id: nullableId,
  star_catalog_sha256: nullableHash,
  transformation_table_id: nullableId,
  transformation_table_sha256: nullableHash,
  age_reckoning_id: nullableId,
  age_reckoning_sha256: nullableHash,
  source_status: sourceStatusSchema,
}).strict();

const placementSchema = z.object({
  placement_id: z.string().min(1),
  star_id: z.enum(STAR_IDS),
  palace_id: z.enum(PALACE_IDS),
  branch_id: z.enum(BRANCH_IDS),
  transformation_types: z.array(z.enum(TRANSFORMATION_IDS)),
  source_status: sourceStatusSchema,
  provenance_ids: z.array(z.string().min(1)),
}).strict();

const relationSchema = z.object({
  relation_id: z.string().min(1),
  type: z.enum(['SQUARE_HARMONY', 'OPPOSITION']),
  palace_ids: z.array(z.enum(PALACE_IDS)).min(2).max(3),
  source_status: sourceStatusSchema,
}).strict();

export const rawZwdsSchema = z.object({
  schema_version: z.literal('zwds.raw.v1'),
  request_id: z.string().min(1),
  engine_version: z.string().min(1),
  generated_at: z.string().min(1),
  chart_fingerprint: z.string().min(1),
  ruleset: rulesetMetadataSchema,
  normalized_input: z.object({
    datetime_local: z.string().min(1),
    timezone: z.string().min(1),
    location: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).strict(),
    sex_at_birth: z.enum(['male','female']).optional(),
    direction_method: z.enum(['year_stem_yinyang_and_sex','explicit','omit']),
  }).strict(),
  resolution: z.object({
    chronometry: z.object({
      civil_local: z.string().min(1),
      effective_local: z.string().min(1),
      ambiguous_time: z.string().optional(),
      nonexistent_time: z.string().optional(),
    }).strict(),
    calendar: z.object({
      lunar_date_before_late_zi: lunarDateSchema,
      chart_lunar_date: lunarDateSchema,
      late_zi_applied: z.boolean(),
      hour_branch_id: z.enum(BRANCH_IDS),
    }).strict(),
  }).strict(),
  chart: z.object({
    coordinate_system: z.unknown().nullable(),
    birth_cycle: z.unknown().nullable(),
    ming_palace_branch_id: z.enum(BRANCH_IDS),
    shen_palace_branch_id: z.enum(BRANCH_IDS),
    five_elements_bureau: z.object({
      id: z.enum(BUREAU_IDS),
      number: z.union([z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6)]),
    }).strict(),
    palaces: z.array(z.object({
      palace_id: z.enum(PALACE_IDS),
      branch_id: z.enum(BRANCH_IDS),
      stem_id: z.enum(STEM_IDS),
      placement_ids: z.array(z.string().min(1)),
    }).strict()),
    star_placements: z.array(placementSchema),
    relations: z.array(relationSchema).nullable(),
    decadal_limits: z.array(z.object({
      index: z.number().int().min(1).max(12),
      age_start: z.number().int().min(0),
      age_end: z.number().int().min(1),
      palace_id: z.enum(PALACE_IDS),
    }).strict()).nullable(),
  }).strict(),
  quality: z.object({
    calculation_status: z.enum(['SUCCESS','DEMO_FIXTURE','ERROR']),
    source_status: sourceStatusSchema,
    crosscheck_status: z.enum(['MATCHED','SOURCE_NEEDED','MISMATCH']),
    human_review_required: z.boolean(),
    warnings: z.array(z.object({
      code: z.string().min(1),
      message: z.string().min(1),
      evidence_ids: z.array(z.string().min(1)),
    }).strict()),
  }).strict(),
  provenance: z.array(z.object({
    record_id: z.string().min(1),
    data_id: z.string().min(1),
    origin: z.string().min(1),
    timestamp: z.string().min(1),
    source_status: sourceStatusSchema,
    field_path: z.string().optional(),
    source_id: z.string().optional(),
  }).strict()),
  derivation_trace: z.array(z.unknown()).nullable(),
}).strict();

export function parseRawZwds(input) {
  const parsed = rawZwdsSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues.slice(0, 4).map((issue) => `${issue.path.join('.')}:${issue.code}`).join(', ');
    throw new ContractError('FUFIRE_CONTRACT_MISMATCH', `Unsupported FuFirE response: ${detail}`);
  }
  return parsed.data;
}

export function assertInvariants(raw) {
  const palaces = raw.chart.palaces;
  const placements = raw.chart.star_placements;
  if (palaces.length !== 12) throw new ContractError('FUFIRE_INVARIANT_PALACE_COUNT', `Expected 12 palaces, got ${palaces.length}`);
  const roles = new Set(palaces.map((palace) => palace.palace_id));
  if (roles.size !== 12) throw new ContractError('FUFIRE_INVARIANT_ROLE_DUP', 'Duplicate palace roles');
  for (const id of PALACE_IDS) if (!roles.has(id)) throw new ContractError('FUFIRE_INVARIANT_ROLE_MISSING', `Missing palace role ${id}`);
  const branches = new Set(palaces.map((palace) => palace.branch_id));
  if (branches.size !== 12) throw new ContractError('FUFIRE_INVARIANT_BRANCH_DUP', 'Each branch must occur exactly once');

  const placementById = new Map();
  for (const placement of placements) {
    if (placementById.has(placement.placement_id)) throw new ContractError('FUFIRE_INVARIANT_PLACEMENT_DUP', `Duplicate placement ${placement.placement_id}`);
    placementById.set(placement.placement_id, placement);
  }
  const referenced = new Set();
  for (const palace of palaces) {
    for (const placementId of palace.placement_ids) {
      const placement = placementById.get(placementId);
      if (!placement) throw new ContractError('FUFIRE_INVARIANT_PLACEMENT_MISSING', `${palace.palace_id} references ${placementId}`);
      if (placement.palace_id !== palace.palace_id || placement.branch_id !== palace.branch_id) {
        throw new ContractError('FUFIRE_INVARIANT_PLACEMENT_COORDINATE', `${placementId} conflicts with palace reference`);
      }
      if (referenced.has(placementId)) throw new ContractError('FUFIRE_INVARIANT_PLACEMENT_MULTIREF', `${placementId} referenced by multiple palaces`);
      referenced.add(placementId);
    }
  }
  for (const placementId of placementById.keys()) {
    if (!referenced.has(placementId)) throw new ContractError('FUFIRE_INVARIANT_PLACEMENT_ORPHAN', `${placementId} is not referenced by a palace`);
  }

  const transformationTargets = new Map();
  for (const placement of placements) {
    for (const type of placement.transformation_types) {
      if (transformationTargets.has(type)) throw new ContractError('FUFIRE_INVARIANT_TRANSFORMATION_DUP', `${type} occurs on multiple placements`);
      transformationTargets.set(type, placement.placement_id);
    }
  }
  if (!branches.has(raw.chart.ming_palace_branch_id)) throw new ContractError('FUFIRE_INVARIANT_MING_BRANCH', 'Ming branch missing');
  if (!branches.has(raw.chart.shen_palace_branch_id)) throw new ContractError('FUFIRE_INVARIANT_SHEN_BRANCH', 'Shen branch missing');

  if (raw.chart.decadal_limits) {
    if (raw.chart.decadal_limits.length !== 12) throw new ContractError('FUFIRE_INVARIANT_DECADE_COUNT', 'Expected 12 decades');
    raw.chart.decadal_limits.forEach((decade, index) => {
      if (decade.index !== index + 1) throw new ContractError('FUFIRE_INVARIANT_DECADE_ORDER', 'Decades must already be sorted');
      if (index > 0 && decade.age_start !== raw.chart.decadal_limits[index - 1].age_end + 1) {
        throw new ContractError('FUFIRE_INVARIANT_DECADE_GAP', 'Decades overlap or have a gap');
      }
    });
  }
}

const oppositeBranch = (branch) => RING[(RING.indexOf(branch) + 6) % 12];
const trineBranches = (branch) => [RING[(RING.indexOf(branch) + 4) % 12], RING[(RING.indexOf(branch) + 8) % 12]];

export function deriveRelations(palaces, sourceStatus) {
  const byBranch = new Map(palaces.map((palace) => [palace.branchId, palace]));
  const unique = new Map();
  for (const palace of palaces) {
    const opposite = byBranch.get(oppositeBranch(palace.branchId));
    if (opposite) {
      const ids = [palace.palaceId, opposite.palaceId].sort();
      unique.set(`OPPOSITION:${ids.join('.')}`, { relationId: `relation.${ids[0]}.${ids[1]}`, type: 'OPPOSITION', palaceIds: ids, sourceStatus });
    }
    const [one, two] = trineBranches(palace.branchId);
    const first = byBranch.get(one);
    const second = byBranch.get(two);
    if (first && second) {
      const ids = [palace.palaceId, first.palaceId, second.palaceId].sort();
      unique.set(`SQUARE_HARMONY:${ids.join('.')}`, { relationId: `relation.${ids.join('.')}`, type: 'SQUARE_HARMONY', palaceIds: ids, sourceStatus });
    }
  }
  return [...unique.values()];
}

const metadataKeys = [
  'ruleset_id','ruleset_version','ruleset_sha256','calendar_policy_id','calendar_policy_sha256',
  'time_policy_id','time_policy_sha256','leap_month_policy_id','leap_month_policy_sha256',
  'year_cycle_policy_id','year_cycle_policy_sha256','star_catalog_id','star_catalog_sha256',
  'transformation_table_id','transformation_table_sha256','age_reckoning_id','age_reckoning_sha256','source_status',
];

export function assertRulesetMetadata(rawRuleset, metadataInput) {
  const metadata = rulesetMetadataSchema.safeParse(metadataInput);
  if (!metadata.success) throw new ContractError('FUFIRE_RULESET_METADATA_CONTRACT', 'Ruleset metadata response is unsupported');
  for (const key of metadataKeys) {
    if (rawRuleset[key] !== metadata.data[key]) {
      throw new ContractError('FUFIRE_RULESET_METADATA_MISMATCH', `Ruleset metadata mismatch at ${key}`);
    }
  }
  return metadata.data;
}

export function normalizeRaw(input, dataMode = 'fixture') {
  const raw = parseRawZwds(input);
  assertInvariants(raw);
  const sourceStatus = raw.quality.source_status;
  const palaces = raw.chart.palaces.map((palace) => ({
    palaceId: palace.palace_id,
    branchId: palace.branch_id,
    stemId: palace.stem_id,
    placementIds: [...palace.placement_ids],
    isMing: palace.branch_id === raw.chart.ming_palace_branch_id,
    isShen: palace.branch_id === raw.chart.shen_palace_branch_id,
    decadeIndex: raw.chart.decadal_limits?.find((decade) => decade.palace_id === palace.palace_id)?.index,
  }));
  const stars = raw.chart.star_placements.map((placement) => ({
    placementId: placement.placement_id,
    starId: placement.star_id,
    palaceId: placement.palace_id,
    branchId: placement.branch_id,
    transformationTypes: [...placement.transformation_types],
    sourceStatus: placement.source_status,
    provenanceIds: [...placement.provenance_ids],
  }));
  const transformations = stars.flatMap((placement) => placement.transformationTypes.map((type) => ({
    transformationId: type,
    placementId: placement.placementId,
    starId: placement.starId,
    palaceId: placement.palaceId,
    sourceStatus: placement.sourceStatus,
  })));
  const relations = raw.chart.relations
    ? raw.chart.relations.map((relation) => ({ relationId: relation.relation_id, type: relation.type, palaceIds: relation.palace_ids, sourceStatus: relation.source_status }))
    : deriveRelations(palaces, sourceStatus);
  const ruleset = raw.ruleset;
  const report = {
    schemaVersion: 'fufire.zwds-evidence.v1',
    calculation: {
      calculationStatus: raw.quality.calculation_status,
      crosscheckStatus: raw.quality.crosscheck_status,
      requestId: raw.request_id,
      engineVersion: raw.engine_version,
      generatedAt: raw.generated_at,
      chartFingerprint: raw.chart_fingerprint,
      rulesetId: ruleset.ruleset_id,
      rulesetVersion: ruleset.ruleset_version,
      rulesetSha256: ruleset.ruleset_sha256,
      schoolLabel: ruleset.school_label,
      calendarPolicyId: ruleset.calendar_policy_id,
      calendarPolicySha256: ruleset.calendar_policy_sha256,
      timePolicyId: ruleset.time_policy_id,
      timePolicySha256: ruleset.time_policy_sha256,
      leapMonthPolicyId: ruleset.leap_month_policy_id,
      yearCyclePolicyId: ruleset.year_cycle_policy_id,
      starCatalogId: ruleset.star_catalog_id,
      starCatalogSha256: ruleset.star_catalog_sha256,
      transformationTableId: ruleset.transformation_table_id,
      transformationTableSha256: ruleset.transformation_table_sha256,
      ageReckoningId: ruleset.age_reckoning_id,
      sourceStatus,
      humanReviewRequired: raw.quality.human_review_required,
      dataMode,
    },
    birthInputSummary: {
      date: raw.normalized_input.datetime_local.slice(0, 10),
      time: raw.normalized_input.datetime_local.slice(11, 16),
      locationDisplayName: '',
      timezone: raw.normalized_input.timezone,
      sexAtBirth: raw.normalized_input.sex_at_birth,
      directionMethod: raw.normalized_input.direction_method,
      includeDecadalLimits: raw.chart.decadal_limits !== null,
    },
    birthResolution: {
      civilLocal: raw.resolution.chronometry.civil_local,
      effectiveLocal: raw.resolution.chronometry.effective_local,
      lunarDateBeforeLateZi: raw.resolution.calendar.lunar_date_before_late_zi,
      chartLunarDate: raw.resolution.calendar.chart_lunar_date,
      lateZiApplied: raw.resolution.calendar.late_zi_applied,
      hourBranchId: raw.resolution.calendar.hour_branch_id,
    },
    anchors: {
      mingBranchId: raw.chart.ming_palace_branch_id,
      shenBranchId: raw.chart.shen_palace_branch_id,
      samePalace: raw.chart.ming_palace_branch_id === raw.chart.shen_palace_branch_id,
      bureauId: raw.chart.five_elements_bureau.id,
      bureauNumber: raw.chart.five_elements_bureau.number,
    },
    palaces,
    stars,
    transformations,
    relations,
    decades: raw.chart.decadal_limits?.map((decade) => ({
      index: decade.index,
      ageStart: decade.age_start,
      ageEnd: decade.age_end,
      palaceId: decade.palace_id,
      sourceStatus,
    })) ?? null,
    quality: {
      sourceStatus,
      humanReviewRequired: raw.quality.human_review_required,
      warnings: raw.quality.warnings.map((warning) => ({ code: warning.code, message: warning.message, evidenceIds: warning.evidence_ids })),
    },
    provenance: raw.provenance.map((record) => ({
      recordId: record.record_id,
      dataId: record.data_id,
      origin: record.origin,
      timestamp: record.timestamp,
      sourceStatus: record.source_status,
      fieldPath: record.field_path,
      sourceId: record.source_id,
    })),
    evidenceIndex: [],
    derivationTrace: raw.derivation_trace,
    scriptPolicy: 'TW_TRADITIONAL',
    schoolProfileStatus: 'NOT_SELECTED',
  };
  report.evidenceIndex = buildEvidenceIndex(report);
  return report;
}

export function buildEvidenceIndex(report) {
  const result = [];
  const add = (evidenceId, type, value, sourceStatus, provenanceId) => result.push({ evidenceId, type, value, sourceStatus, provenanceId });
  const status = report.quality.sourceStatus;
  add('ruleset', 'ruleset', { ...report.calculation }, status);
  add('resolution.chronometry', 'chronometry', { civilLocal: report.birthResolution.civilLocal, effectiveLocal: report.birthResolution.effectiveLocal }, status);
  add('resolution.calendar', 'calendar', report.birthResolution, status);
  add('anchor.ming', 'anchor', { branchId: report.anchors.mingBranchId }, status);
  add('anchor.shen', 'anchor', { branchId: report.anchors.shenBranchId }, status);
  add('bureau', 'bureau', { id: report.anchors.bureauId, number: report.anchors.bureauNumber }, status);
  for (const palace of report.palaces) add(`palace.${palace.palaceId}`, 'palace', palace, status);
  for (const placement of report.stars) add(`placement.${placement.placementId}`, 'placement', placement, placement.sourceStatus, placement.provenanceIds[0]);
  for (const transformation of report.transformations) add(`transformation.${transformation.transformationId}`, 'transformation', transformation, transformation.sourceStatus);
  for (const relation of report.relations) add(relation.relationId, 'relation', relation, relation.sourceStatus);
  if (report.decades) for (const decade of report.decades) add(`decade.${decade.index}`, 'decade', decade, decade.sourceStatus);
  add('quality.source_status', 'quality', report.quality, status);
  for (const record of report.provenance) add(`provenance.${record.recordId}`, 'provenance', record, record.sourceStatus, record.recordId);
  return result;
}

const rule = (ruleId, ruleVersion, ruleType, fields) => ({
  sectionId: fields.sectionId,
  ruleId,
  ruleVersion,
  ruleType,
  truthClass: fields.truthClass,
  evidenceIds: fields.evidenceIds,
  localeTextKey: fields.localeTextKey,
  textParams: fields.textParams,
  limitations: ['non_predictive', 'evidence_bound'],
  sourceStatus: fields.sourceStatus,
  relatedPalaceId: fields.relatedPalaceId,
  relatedStarId: fields.relatedStarId,
  relatedTransformationId: fields.relatedTransformationId,
});

export function generateSections(report) {
  const sections = [];
  const truthClass = report.calculation.dataMode === 'fixture' ? 'DEMO_FIXTURE' : 'CATALOG_FACT';
  const placementsByPalace = new Map(report.palaces.map((palace) => [palace.palaceId, palace.placementIds.map((id) => report.stars.find((placement) => placement.placementId === id))]));
  for (const palace of report.palaces) {
    const placements = (placementsByPalace.get(palace.palaceId) ?? []).filter(Boolean);
    if (placements.length === 0 && palace.isMing) {
      sections.push(rule('NO_CORE_STAR_IN_MING', '1.0.0', 'NO_CORE_STAR_IN_MING', {
        sectionId: 'sec.no-core-star-ming', truthClass, evidenceIds: [`palace.${palace.palaceId}`, 'anchor.ming'], localeTextKey: 'sections.noCoreStarMing', textParams: { palace: palace.palaceId }, sourceStatus: report.quality.sourceStatus, relatedPalaceId: palace.palaceId,
      }));
    }
    if (placements.length > 1) {
      sections.push(rule('MULTIPLE_STARS_IN_PALACE', '1.0.0', 'MULTIPLE_STARS_IN_PALACE', {
        sectionId: `sec.multi.${palace.palaceId}`, truthClass, evidenceIds: [`palace.${palace.palaceId}`, ...placements.map((placement) => `placement.${placement.placementId}`)], localeTextKey: 'sections.multipleStars', textParams: { stars: placements.map((placement) => placement.starId).join(','), palace: palace.palaceId }, sourceStatus: report.quality.sourceStatus, relatedPalaceId: palace.palaceId,
      }));
    }
    for (const placement of placements) {
      if (placement.transformationTypes.length === 0) {
        sections.push(rule('STAR_IN_PALACE', '1.0.0', 'STAR_IN_PALACE', {
          sectionId: `sec.placement.${placement.placementId}`, truthClass, evidenceIds: [`placement.${placement.placementId}`, `palace.${palace.palaceId}`], localeTextKey: 'sections.starInPalace', textParams: { star: placement.starId, palace: palace.palaceId }, sourceStatus: placement.sourceStatus, relatedPalaceId: palace.palaceId, relatedStarId: placement.starId,
        }));
      }
      for (const transformationType of placement.transformationTypes) {
        sections.push(rule('STAR_WITH_TRANSFORMATION', '1.0.0', 'STAR_WITH_TRANSFORMATION', {
          sectionId: `sec.transformation.${transformationType}`, truthClass, evidenceIds: [`placement.${placement.placementId}`, `transformation.${transformationType}`, `palace.${palace.palaceId}`], localeTextKey: 'sections.starWithTransformation', textParams: { star: placement.starId, transformation: transformationType, palace: palace.palaceId }, sourceStatus: placement.sourceStatus, relatedPalaceId: palace.palaceId, relatedStarId: placement.starId, relatedTransformationId: transformationType,
        }));
      }
    }
  }
  if (report.anchors.samePalace) sections.push(rule('MING_SHEN_COLOCATED', '1.0.0', 'MING_SHEN_COLOCATED', {
    sectionId: 'sec.ming-shen-colocated', truthClass, evidenceIds: ['anchor.ming','anchor.shen'], localeTextKey: 'sections.mingShenColocated', textParams: { branch: report.anchors.mingBranchId }, sourceStatus: report.quality.sourceStatus,
  }));
  const mingRelation = report.relations.find((relation) => relation.type === 'SQUARE_HARMONY' && relation.palaceIds.includes('MING'));
  if (mingRelation) sections.push(rule('PALACE_NETWORK', '1.0.0', 'PALACE_NETWORK', {
    sectionId: 'sec.palace-network', truthClass: 'TRADITIONAL_RULE', evidenceIds: [mingRelation.relationId,'anchor.ming'], localeTextKey: 'sections.palaceNetwork', sourceStatus: report.quality.sourceStatus,
  }));
  if (report.decades) sections.push(rule('DECADE_ACTIVATES_PALACE', '1.0.0', 'DECADE_ACTIVATES_PALACE', {
    sectionId: 'sec.decades', truthClass, evidenceIds: report.decades.map((decade) => `decade.${decade.index}`), localeTextKey: 'sections.decadeWindows', sourceStatus: report.quality.sourceStatus,
  }));
  sections.push(rule('SOURCE_LIMITS', '1.0.0', 'SOURCE_LIMITS', {
    sectionId: 'sec.source-limits', truthClass: 'SOURCE_NEEDED', evidenceIds: ['ruleset','quality.source_status'], localeTextKey: 'sections.sourceLimits', sourceStatus: report.quality.sourceStatus,
  }));

  // AMD-001 / REQ-019: unknown / unsupported / unresolved evidence is a HARD fail-closed
  // refusal, never a partial report with a soft-drop warning.
  const evidenceById = new Map(report.evidenceIndex.map((entry) => [entry.evidenceId, entry]));
  for (const section of sections) {
    const unresolved = section.evidenceIds.filter((id) => !evidenceById.has(id));
    if (unresolved.length > 0) {
      throw new ContractError('EVIDENCE_UNRESOLVED', `Section ${section.sectionId} references unresolved evidence: ${unresolved.join(', ')}`);
    }
    // Fail closed if the section itself, or ANY evidence entry it cites, rests on BLOCKED evidence.
    // (Checking cited entries — not only section.sourceStatus — closes the heterogeneous-status gap
    // that a real FuFirE response could expose; the uniform-status fixture cannot exercise it.)
    const blocked = section.sourceStatus === 'BLOCKED'
      || section.evidenceIds.some((id) => evidenceById.get(id)?.sourceStatus === 'BLOCKED');
    if (blocked) {
      throw new ContractError('EVIDENCE_UNRESOLVED', `Section ${section.sectionId} rests on BLOCKED evidence`);
    }
  }
  if (report.calculation.crosscheckStatus === 'MISMATCH') {
    throw new ContractError('EVIDENCE_UNRESOLVED', 'Crosscheck status is MISMATCH; interpretation is fail-closed');
  }
  // `warnings` retained (always empty now) for response-shape API stability; the soft-drop path is gone by design.
  return { sections, warnings: [] };
}
