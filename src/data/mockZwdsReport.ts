import type {
  NormalizedZwdsReport, NormalizedPalace, NormalizedStarPlacement,
  NormalizedTransformation, NormalizedRelation, NormalizedDecade,
  ReportSection, PalaceId,
} from '@/domain/zwdsTypes';

const S = 'SOURCE_NEEDED' as const;

const STARS: NormalizedStarPlacement[] = [
  ['natal:WU_QU','WU_QU','TIAN_ZHAI','SI',['HUA_KE']],
  ['natal:PO_JUN','PO_JUN','TIAN_ZHAI','SI',['HUA_QU']],
  ['natal:TAI_YANG','TAI_YANG','GUAN_LU','WU',['HUA_JI']],
  ['natal:TIAN_LIANG','TIAN_LIANG','JIAO_YOU','WEI',[]],
  ['natal:TIAN_JI','TIAN_JI','QIAN_YI','SHEN',[]],
  ['natal:TAI_YIN','TAI_YIN','QIAN_YI','SHEN',[]],
  ['natal:TIAN_XIANG','TIAN_XIANG','FU_DE','CHEN',[]],
  ['natal:ZI_WEI','ZI_WEI','JI_E','YOU',[]],
  ['natal:TAN_LANG','TAN_LANG','JI_E','YOU',[]],
  ['natal:JU_MEN','JU_MEN','CAI_BO','XU',[]],
  ['natal:YOU_BI','YOU_BI','CAI_BO','XU',[]],
  ['natal:WEN_CHANG','WEN_CHANG','CAI_BO','XU',[]],
  ['natal:LIAN_ZHEN','LIAN_ZHEN','XIONG_DI','CHOU',['HUA_LU']],
  ['natal:QI_SHA','QI_SHA','XIONG_DI','CHOU',[]],
  ['natal:TIAN_TONG','TIAN_TONG','ZI_NU','HAI',[]],
  ['natal:TIAN_FU','TIAN_FU','ZI_NU','HAI',[]],
].map(([placementId, starId, palaceId, branchId, transformationTypes]) => ({
  placementId, starId, palaceId, branchId, transformationTypes,
  sourceStatus: S, provenanceIds: ['prov-raw-1'],
})) as NormalizedStarPlacement[];

const ids = (palaceId: PalaceId) => STARS.filter((star) => star.palaceId === palaceId).map((star) => star.placementId);
const PALACES: NormalizedPalace[] = [
  ['TIAN_ZHAI','SI','JI',4],['GUAN_LU','WU','GENG',5],['JIAO_YOU','WEI','XIN',6],
  ['QIAN_YI','SHEN','REN',7],['FU_DE','CHEN','WU',3],['JI_E','YOU','GUI',8],
  ['FU_MU','MAO','DING',2],['CAI_BO','XU','JIA',9],['MING','YIN','BING',1],
  ['XIONG_DI','CHOU','YI',12],['FU_QI','ZI','BING',11],['ZI_NU','HAI','DING',10],
].map(([palaceId, branchId, stemId, decadeIndex]) => ({
  palaceId, branchId, stemId, placementIds: ids(palaceId as PalaceId),
  isMing: palaceId === 'MING', isShen: palaceId === 'MING', decadeIndex,
})) as NormalizedPalace[];

const TRANSFORMATIONS: NormalizedTransformation[] = STARS.flatMap((placement) =>
  placement.transformationTypes.map((transformationId) => ({
    transformationId, placementId: placement.placementId, starId: placement.starId,
    palaceId: placement.palaceId, sourceStatus: placement.sourceStatus,
  }))
);

const RELATIONS: NormalizedRelation[] = [
  ['relation.CAI_BO.GUAN_LU.MING','SQUARE_HARMONY',['CAI_BO','GUAN_LU','MING']],
  ['relation.JI_E.TIAN_ZHAI.XIONG_DI','SQUARE_HARMONY',['JI_E','TIAN_ZHAI','XIONG_DI']],
  ['relation.FU_DE.FU_QI.QIAN_YI','SQUARE_HARMONY',['FU_DE','FU_QI','QIAN_YI']],
  ['relation.FU_MU.JIAO_YOU.ZI_NU','SQUARE_HARMONY',['FU_MU','JIAO_YOU','ZI_NU']],
  ['relation.MING.QIAN_YI','OPPOSITION',['MING','QIAN_YI']],
  ['relation.JIAO_YOU.XIONG_DI','OPPOSITION',['JIAO_YOU','XIONG_DI']],
  ['relation.FU_QI.GUAN_LU','OPPOSITION',['FU_QI','GUAN_LU']],
  ['relation.TIAN_ZHAI.ZI_NU','OPPOSITION',['TIAN_ZHAI','ZI_NU']],
  ['relation.CAI_BO.FU_DE','OPPOSITION',['CAI_BO','FU_DE']],
  ['relation.FU_MU.JI_E','OPPOSITION',['FU_MU','JI_E']],
].map(([relationId, type, palaceIds]) => ({ relationId, type, palaceIds, sourceStatus: S })) as NormalizedRelation[];

const decadePalaces: PalaceId[] = ['MING','FU_MU','FU_DE','TIAN_ZHAI','GUAN_LU','JIAO_YOU','QIAN_YI','JI_E','CAI_BO','ZI_NU','FU_QI','XIONG_DI'];
const DECADES: NormalizedDecade[] = decadePalaces.map((palaceId, index) => ({
  index: index + 1, ageStart: 6 + index * 10, ageEnd: 15 + index * 10, palaceId, sourceStatus: S,
}));

export const DEMO_REPORT: NormalizedZwdsReport = {
  schemaVersion: 'fufire.zwds-evidence.v1',
  calculation: {
    calculationStatus: 'DEMO_FIXTURE', crosscheckStatus: 'SOURCE_NEEDED',
    requestId: 'fix-2024-0201-shanghai', engineVersion: 'SOURCE_NEEDED', generatedAt: '2024-01-15T00:00:00Z',
    chartFingerprint: 'fufire-fix-sha384-demo', rulesetId: 'zwds.fufire.core-seed.v1', rulesetVersion: '0.1.0',
    rulesetSha256: null, schoolLabel: null, calendarPolicyId: null, calendarPolicySha256: null,
    timePolicyId: null, timePolicySha256: null, leapMonthPolicyId: null, yearCyclePolicyId: null,
    starCatalogId: null, starCatalogSha256: null, transformationTableId: null,
    transformationTableSha256: null, ageReckoningId: null, sourceStatus: S,
    humanReviewRequired: true, dataMode: 'fixture',
  },
  birthInputSummary: {
    date: '1984-02-01', time: '23:30', locationDisplayName: 'Shanghai, China',
    timezone: 'Asia/Shanghai', sexAtBirth: 'male', directionMethod: 'year_stem_yinyang_and_sex', includeDecadalLimits: true,
  },
  birthResolution: {
    civilLocal: '1984-02-01T23:30:00', effectiveLocal: '1984-02-01T23:30:00',
    lunarDateBeforeLateZi: { year: 1983, month: 12, day: 30 }, chartLunarDate: { year: 1984, month: 1, day: 1 },
    lateZiApplied: true, hourBranchId: 'ZI',
  },
  anchors: { mingBranchId: 'YIN', shenBranchId: 'YIN', samePalace: true, bureauId: 'FIRE_6', bureauNumber: 6 },
  palaces: PALACES, stars: STARS, transformations: TRANSFORMATIONS, relations: RELATIONS, decades: DECADES,
  quality: {
    sourceStatus: S, humanReviewRequired: true,
    warnings: [{ code: 'RULESET_HASHES_UNAVAILABLE', message: 'The supplied fixture does not contain reviewed ruleset hashes.', evidenceIds: ['ruleset'] }],
  },
  provenance: [{ recordId: 'prov-raw-1', dataId: 'chart', origin: 'fufire-zwds-engine', timestamp: '2024-01-15T00:00:00Z', sourceStatus: S, fieldPath: 'chart', sourceId: 'zwds.fufire.core-seed.v1' }],
  evidenceIndex: [], derivationTrace: [], scriptPolicy: 'TW_TRADITIONAL', schoolProfileStatus: 'NOT_SELECTED',
};

DEMO_REPORT.evidenceIndex = [
  { evidenceId: 'ruleset', type: 'ruleset', value: DEMO_REPORT.calculation, sourceStatus: S },
  { evidenceId: 'resolution.chronometry', type: 'chronometry', value: DEMO_REPORT.birthResolution, sourceStatus: S },
  { evidenceId: 'resolution.calendar', type: 'calendar', value: DEMO_REPORT.birthResolution, sourceStatus: S },
  { evidenceId: 'anchor.ming', type: 'anchor', value: { branchId: 'YIN' }, sourceStatus: S },
  { evidenceId: 'anchor.shen', type: 'anchor', value: { branchId: 'YIN' }, sourceStatus: S },
  { evidenceId: 'bureau', type: 'bureau', value: DEMO_REPORT.anchors, sourceStatus: S },
  ...PALACES.map((palace) => ({ evidenceId: `palace.${palace.palaceId}`, type: 'palace', value: palace, sourceStatus: S })),
  ...STARS.map((placement) => ({ evidenceId: `placement.${placement.placementId}`, type: 'placement', value: placement, sourceStatus: S, provenanceId: placement.provenanceIds[0] })),
  ...TRANSFORMATIONS.map((transformation) => ({ evidenceId: `transformation.${transformation.transformationId}`, type: 'transformation', value: transformation, sourceStatus: S })),
  ...RELATIONS.map((relation) => ({ evidenceId: relation.relationId, type: 'relation', value: relation, sourceStatus: S })),
  ...DECADES.map((decade) => ({ evidenceId: `decade.${decade.index}`, type: 'decade', value: decade, sourceStatus: S })),
  { evidenceId: 'quality.source_status', type: 'quality', value: DEMO_REPORT.quality, sourceStatus: S },
  { evidenceId: 'provenance.prov-raw-1', type: 'provenance', value: DEMO_REPORT.provenance[0], sourceStatus: S, provenanceId: 'prov-raw-1' },
];

function section(partial: Omit<ReportSection, 'ruleId'|'ruleVersion'|'limitations'>): ReportSection {
  return { ...partial, ruleId: partial.ruleType, ruleVersion: '1.0.0', limitations: ['non_predictive','evidence_bound'] };
}

export function generateDemoSections(report: NormalizedZwdsReport): ReportSection[] {
  const sections: ReportSection[] = [];
  for (const palace of report.palaces) {
    const placements = palace.placementIds.flatMap((id) => report.stars.find((item) => item.placementId === id) ?? []);
    if (placements.length === 0 && palace.isMing) sections.push(section({
      sectionId: 'sec.no-core-star-ming', ruleType: 'NO_CORE_STAR_IN_MING', relatedPalaceId: palace.palaceId,
      truthClass: 'DEMO_FIXTURE', evidenceIds: [`palace.${palace.palaceId}`,'anchor.ming'], localeTextKey: 'sections.noCoreStarMing', textParams: { palace: palace.palaceId }, sourceStatus: S,
    }));
    if (placements.length > 1) sections.push(section({
      sectionId: `sec.multi.${palace.palaceId}`, ruleType: 'MULTIPLE_STARS_IN_PALACE', relatedPalaceId: palace.palaceId,
      truthClass: 'DEMO_FIXTURE', evidenceIds: [`palace.${palace.palaceId}`,...placements.map((item) => `placement.${item.placementId}`)],
      localeTextKey: 'sections.multipleStars', textParams: { stars: placements.map((item) => item.starId).join(','), palace: palace.palaceId }, sourceStatus: S,
    }));
    for (const placement of placements) {
      if (!placement.transformationTypes.length) sections.push(section({
        sectionId: `sec.placement.${placement.placementId}`, ruleType: 'STAR_IN_PALACE', relatedPalaceId: palace.palaceId, relatedStarId: placement.starId,
        truthClass: 'DEMO_FIXTURE', evidenceIds: [`placement.${placement.placementId}`,`palace.${palace.palaceId}`], localeTextKey: 'sections.starInPalace', textParams: { star: placement.starId, palace: palace.palaceId }, sourceStatus: S,
      }));
      for (const type of placement.transformationTypes) sections.push(section({
        sectionId: `sec.transformation.${type}`, ruleType: 'STAR_WITH_TRANSFORMATION', relatedPalaceId: palace.palaceId, relatedStarId: placement.starId, relatedTransformationId: type,
        truthClass: 'DEMO_FIXTURE', evidenceIds: [`placement.${placement.placementId}`,`transformation.${type}`,`palace.${palace.palaceId}`], localeTextKey: 'sections.starWithTransformation', textParams: { star: placement.starId, transformation: type, palace: palace.palaceId }, sourceStatus: S,
      }));
    }
  }
  sections.push(section({ sectionId: 'sec.ming-shen-colocated', ruleType: 'MING_SHEN_COLOCATED', truthClass: 'DEMO_FIXTURE', evidenceIds: ['anchor.ming','anchor.shen'], localeTextKey: 'sections.mingShenColocated', textParams: { branch: 'YIN' }, sourceStatus: S }));
  sections.push(section({ sectionId: 'sec.palace-network', ruleType: 'PALACE_NETWORK', truthClass: 'TRADITIONAL_RULE', evidenceIds: ['relation.CAI_BO.GUAN_LU.MING','anchor.ming'], localeTextKey: 'sections.palaceNetwork', sourceStatus: S }));
  sections.push(section({ sectionId: 'sec.decades', ruleType: 'DECADE_ACTIVATES_PALACE', truthClass: 'DEMO_FIXTURE', evidenceIds: DECADES.map((d) => `decade.${d.index}`), localeTextKey: 'sections.decadeWindows', sourceStatus: S }));
  sections.push(section({ sectionId: 'sec.source-limits', ruleType: 'SOURCE_LIMITS', truthClass: 'SOURCE_NEEDED', evidenceIds: ['ruleset','quality.source_status'], localeTextKey: 'sections.sourceLimits', sourceStatus: S }));
  const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  return sections.filter((item) => item.evidenceIds.every((id) => valid.has(id)));
}