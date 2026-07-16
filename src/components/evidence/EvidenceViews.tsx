import { useApp } from '@/app/appContext';
import type { ReportSection } from '@/domain/zwdsTypes';
import { labelFor, lookupBranch, lookupPalace, lookupStar, lookupTransformation } from '@/data/zwdsCatalog';
import { SourceChip, TruthBadge } from '@/components/common/ReportPrimitives';

export function EvidenceSection({ section }: { section: ReportSection }) {
  const { state, t } = useApp();
  const report = state.report!;
  const valid = new Set(report.evidenceIndex.map((entry) => entry.evidenceId));
  const allValid = section.evidenceIds.every((id) => valid.has(id));
  const params: Record<string,string> = {};
  for (const [key, value] of Object.entries(section.textParams ?? {})) {
    if (key === 'star') params[key] = lookupStar(value)?.hanzi ?? value;
    else if (key === 'stars') params[key] = value.split(',').map((id) => lookupStar(id)?.hanzi ?? id).join(', ');
    else if (key === 'palace') { const entry = lookupPalace(value); params[key] = entry ? labelFor(entry, state.language) ?? value : value; }
    else if (key === 'transformation') params[key] = lookupTransformation(value)?.hanzi ?? value;
    else if (key === 'branch') params[key] = lookupBranch(value)?.hanzi ?? value;
    else params[key] = value;
  }
  let text = t(section.localeTextKey);
  for (const [key, value] of Object.entries(params)) text = text.replace(`{${key}}`, value);
  return <article className="evidence-section report-module__item"><p>{text}</p><TruthBadge truthClass={section.truthClass} label={t(`truth.${section.truthClass}`)}/><p><code>{section.ruleId}@{section.ruleVersion}</code></p>{allValid ? <details><summary>{t('evidence.showIds')}</summary><ul>{section.evidenceIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul></details> : <SourceChip status="BLOCKED" label={t('evidence.invalidIds')}/>}</article>;
}

export function EvidenceDrawer() {
  const { state, dispatch, t } = useApp();
  if (!state.report || !state.evidenceDrawerOpen) return null;
  return <aside className="evidence-drawer evidence-drawer--open" aria-label={t('evidence.title')}><div className="evidence-drawer__header"><h2>{t('evidence.title')}</h2><button className="evidence-drawer__close" onClick={() => dispatch({ type: 'TOGGLE_EVIDENCE_DRAWER', payload: false })}>{t('common.close')}</button></div>{state.report.evidenceIndex.map((entry) => <div className="evidence-record" key={entry.evidenceId}><code>{entry.evidenceId}</code><SourceChip status={entry.sourceStatus} label={entry.sourceStatus}/></div>)}</aside>;
}

export function EvidencePage() {
  const { state, t } = useApp();
  return <section className="report-module" style={{ gridColumn: '1/-1' }}><h2 className="report-module__title">{t('evidence.title')}</h2>{state.report?.evidenceIndex.map((entry) => <div className="evidence-record" key={entry.evidenceId}><code>{entry.evidenceId}</code><pre>{JSON.stringify(entry.value, null, 2)}</pre><SourceChip status={entry.sourceStatus} label={entry.sourceStatus}/></div>)}</section>;
}