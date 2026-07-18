import { useApp } from '@/app/appContext';
import { PalaceWorkspace } from '@/components/atlas/PalaceWorkspace';
import { EvidenceDrawer, EvidencePage, EvidenceSection } from '@/components/evidence/EvidenceViews';
import { SourceChip, TruthBadge } from '@/components/common/ReportPrimitives';
import { labelFor, lookupBureau, lookupPalace, lookupStar, lookupTransformation, CATALOG_ID, CATALOG_VERSION, CATALOG_CONTENT_SHA256, catalogueGovernanceStatus } from '@/data/zwdsCatalog';
import type { NormalizedZwdsReport } from '@/domain/zwdsTypes';
import { reportIsSourceReviewed } from '@/domain/zwdsTypes';
import type { TruthClass } from '@/domain/truthTypes';

// AMD-002 / RISK-005: until the interpretation catalog / ruleset is signed off by a
// source-governance reviewer, every public report must carry a persistent, prominent
// "illustrative, unreviewed — not authoritative" notice. It is rendered at the top of
// the MAIN report surface for EVERY sub-view (never behind a tab, tooltip or <details>)
// and stays in normal flow so it never overlaps the controls the a11y/touch-target
// specs measure. The condition is derived from the real model: it shows whenever the
// report is not genuinely SOURCE_REVIEWED, so it self-hides once a reviewer signs the
// source and cannot be spoofed away while the data is still SOURCE_NEEDED.
function NotAuthoritativeNotice() {
  const { state, t } = useApp();
  const report = state.report!;
  if (reportIsSourceReviewed(report)) return null;
  return <div
    className="report-notice"
    role="note"
    aria-label={t('report.notAuthoritative.title')}
    data-testid="report-not-authoritative"
    style={{ gridColumn: '1/-1' }}
  >
    <p className="report-notice__title">{t('report.notAuthoritative.title')}</p>
    <p className="report-notice__body">{t('report.notAuthoritative.body')}</p>
  </div>;
}

// Convention identifiers the calculation model may resolve. A null value means
// the convention has NOT been resolved to a reviewed identifier yet — that is
// exactly what "unresolved conventions" means for AC-011. Derived from the real
// report, never hardcoded to a status.
const CONVENTION_FIELDS: Array<keyof NormalizedZwdsReport['calculation']> = [
  'calendarPolicyId', 'timePolicyId', 'leapMonthPolicyId', 'yearCyclePolicyId',
  'starCatalogId', 'transformationTableId', 'ageReckoningId',
];

function unresolvedConventions(report: NormalizedZwdsReport): string[] {
  return CONVENTION_FIELDS.filter((field) => report.calculation[field] == null);
}

// AC-011: provenance and unresolved conventions must be readable on the MAIN
// report surface, not only inside the Evidence/Method tab. This panel is
// rendered for every report sub-view so the information is never gated behind a
// tab, tooltip or <details>.
function ReportProvenancePanel() {
  const { state, t } = useApp();
  const report = state.report!;
  const unresolved = unresolvedConventions(report);
  return <section className="report-provenance report-module" style={{ gridColumn: '1/-1' }} aria-label={t('evidence.provenancePanel')}>
    <div className="report-provenance__block">
      <h2 className="report-module__title">{t('evidence.provenance')}</h2>
      {report.provenance.length === 0
        ? <p>{t('evidence.noRecords')}</p>
        : report.provenance.map((record) => <p className="report-provenance__origin" key={record.recordId}>
            <b>{record.origin}</b> · <code>{record.dataId}</code> <SourceChip status={record.sourceStatus} label={record.sourceStatus}/>
          </p>)}
    </div>
    <div className="report-provenance__block">
      <h2 className="report-module__title">{t('method.unresolvedConventions')}</h2>
      {unresolved.length === 0
        ? <p>{t('method.unresolvedConventions.none')}</p>
        : <p className="report-provenance__conventions"><b>{unresolved.length}</b> · {unresolved.map((field) => <code key={field}>{field}</code>).reduce((prev, curr) => <>{prev} {curr}</>)}</p>}
    </div>
  </section>;
}

function ReadingPage() {
  const { state, t } = useApp();
  const report = state.report!;
  const bureau = lookupBureau(report.anchors.bureauId);
  return <div style={{ gridColumn: '1/-1' }}><section className="report-module"><h2 className="report-module__title">{t('reading.chartCore')}</h2><p>MING: {report.anchors.mingBranchId} · SHEN: {report.anchors.shenBranchId}</p><p>{t('atlas.center.bureau')}: <span className="hanzi">{bureau?.hanzi}</span> {bureau ? labelFor(bureau, state.language) : report.anchors.bureauId}</p><p>Fingerprint: <code>{report.calculation.chartFingerprint}</code></p><TruthBadge truthClass="CALCULATED_FACT" label={t('truth.CALCULATED_FACT')}/></section>
    <section className="report-module"><h2 className="report-module__title">{t('reading.starCatalog')}</h2>{report.stars.map((placement) => { const star = lookupStar(placement.starId); const palace = lookupPalace(placement.palaceId); return <div className="report-module__item" key={placement.placementId}><span className="hanzi">{star?.hanzi}</span> {star ? labelFor(star, state.language) : placement.starId} → <span className="hanzi">{palace?.hanzi}</span> <code>{placement.placementId}</code> <SourceChip status={placement.sourceStatus} label={placement.sourceStatus}/></div>; })}</section>
    <section className="report-module"><h2 className="report-module__title">{t('reading.transformations')}</h2><p>{t('reading.transformationNote')}</p>{report.transformations.map((item) => <div className="report-module__item" key={item.transformationId}><span className="hanzi">{lookupTransformation(item.transformationId)?.hanzi}</span> {item.transformationId} → <code>{item.placementId}</code></div>)}</section>
    <section className="report-module"><h2 className="report-module__title">{t('reading.interpretations')}</h2>{state.sections.map((section) => <EvidenceSection key={section.sectionId} section={section}/>)}</section></div>;
}

function MethodPage() {
  const { state, t } = useApp();
  const report = state.report!;
  const truthClasses: TruthClass[] = ['CALCULATED_FACT','CATALOG_FACT','TRADITIONAL_RULE','PRODUCT_TRANSLATION','REFLECTIVE_HYPOTHESIS','DEMO_FIXTURE','SOURCE_NEEDED'];
  return <section className="report-module" style={{ gridColumn: '1/-1' }}><h2 className="report-module__title">{t('method.title')}</h2><p>{t('method.mockDataDisclaimer')}</p><dl><dt>Ruleset</dt><dd>{report.calculation.rulesetId} · {report.calculation.rulesetVersion}</dd><dt>Ruleset SHA-256</dt><dd>{report.calculation.rulesetSha256 ?? 'SOURCE_NEEDED'}</dd><dt>Crosscheck</dt><dd>{report.calculation.crosscheckStatus}</dd><dt>Engine</dt><dd>{report.calculation.engineVersion}</dd><dt>Catalogue</dt><dd>{CATALOG_ID} · {CATALOG_VERSION}</dd><dt>Catalogue digest</dt><dd><code>{CATALOG_CONTENT_SHA256.slice(0, 16)}…</code> · {catalogueGovernanceStatus()}</dd></dl><h3>{t('method.truthClasses')}</h3>{truthClasses.map((truthClass) => <p key={truthClass}><TruthBadge truthClass={truthClass} label={t(`truth.${truthClass}`)}/> {t(`method.truthClass.${truthClass}`)}</p>)}<h3>Warnings</h3>{report.quality.warnings.map((warning) => <p key={warning.code}><code>{warning.code}</code> {warning.message}</p>)}</section>;
}

export function ReportWorkspace() {
  const { state, t } = useApp();
  const report = state.report!;
  return <main className="report-workspace"><div className="report-layout container"><NotAuthoritativeNotice/><ReportProvenancePanel/>{state.reportSubView === 'atlas' && <PalaceWorkspace/>}{state.reportSubView === 'reading' && <ReadingPage/>}{state.reportSubView === 'evidence' && <EvidencePage/>}{state.reportSubView === 'method' && <MethodPage/>}</div><EvidenceDrawer/><footer className="print-footer">{t('print.fingerprint')}: {report.calculation.chartFingerprint} · {report.calculation.sourceStatus} · {report.calculation.rulesetId}</footer></main>;
}