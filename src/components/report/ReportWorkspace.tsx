import { useApp } from '@/app/appContext';
import { PalaceWorkspace } from '@/components/atlas/PalaceWorkspace';
import { EvidenceDrawer, EvidencePage, EvidenceSection } from '@/components/evidence/EvidenceViews';
import { SourceChip, TruthBadge } from '@/components/common/ReportPrimitives';
import { labelFor, lookupBureau, lookupPalace, lookupStar, lookupTransformation } from '@/data/zwdsCatalog';
import type { TruthClass } from '@/domain/truthTypes';

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
  return <section className="report-module" style={{ gridColumn: '1/-1' }}><h2 className="report-module__title">{t('method.title')}</h2><p>{t('method.mockDataDisclaimer')}</p><dl><dt>Ruleset</dt><dd>{report.calculation.rulesetId} · {report.calculation.rulesetVersion}</dd><dt>Ruleset SHA-256</dt><dd>{report.calculation.rulesetSha256 ?? 'SOURCE_NEEDED'}</dd><dt>Crosscheck</dt><dd>{report.calculation.crosscheckStatus}</dd><dt>Engine</dt><dd>{report.calculation.engineVersion}</dd></dl><h3>{t('method.truthClasses')}</h3>{truthClasses.map((truthClass) => <p key={truthClass}><TruthBadge truthClass={truthClass} label={t(`truth.${truthClass}`)}/> {t(`method.truthClass.${truthClass}`)}</p>)}<h3>Warnings</h3>{report.quality.warnings.map((warning) => <p key={warning.code}><code>{warning.code}</code> {warning.message}</p>)}</section>;
}

export function ReportWorkspace() {
  const { state, t } = useApp();
  const report = state.report!;
  return <main className="report-workspace"><div className="report-layout container">{state.reportSubView === 'atlas' && <PalaceWorkspace/>}{state.reportSubView === 'reading' && <ReadingPage/>}{state.reportSubView === 'evidence' && <EvidencePage/>}{state.reportSubView === 'method' && <MethodPage/>}</div><EvidenceDrawer/><footer className="print-footer">{t('print.fingerprint')}: {report.calculation.chartFingerprint} · {report.calculation.sourceStatus} · {report.calculation.rulesetId}</footer></main>;
}