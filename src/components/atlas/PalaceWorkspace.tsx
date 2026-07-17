import { useEffect, useRef } from 'react';
import { useApp } from '@/app/appContext';
import type { NormalizedPalace, PalaceId } from '@/domain/zwdsTypes';
import { placementsForPalace, relatedPalaces } from '@/domain/zwdsTypes';
import { PALACE_GRID_LAYOUT } from '@/shared/palaceGrid';
import { labelFor, lookupBranch, lookupPalace, lookupStar, lookupStem, lookupTransformation } from '@/data/zwdsCatalog';
import { SourceChip, TruthBadge } from '@/components/common/ReportPrimitives';

function PalaceCell({ palace }: { palace: NormalizedPalace }) {
  const { state, dispatch, t } = useApp();
  const report = state.report!;
  const connections = relatedPalaces(report, state.selectedPalaceId);
  const selected = palace.palaceId === state.selectedPalaceId;
  const harmony = connections.harmony.includes(palace.palaceId);
  const opposition = connections.opposition === palace.palaceId;
  const dimmed = Boolean(state.selectedPalaceId && !selected && !harmony && !opposition);
  const entry = lookupPalace(palace.palaceId);
  const branch = lookupBranch(palace.branchId);
  const stem = lookupStem(palace.stemId);
  const cell = PALACE_GRID_LAYOUT.find((item) => item.branchId === palace.branchId)!;
  const placements = placementsForPalace(report, palace.palaceId);
  const localized = entry ? labelFor(entry, state.language) : palace.palaceId;
  const status = selected ? t('atlas.selected') : harmony ? t('atlas.harmony') : opposition ? t('atlas.opposition') : '';
  return <button
    data-palace-id={palace.palaceId}
    data-testid={`palace-cell-${palace.palaceId}`}
    style={{ gridColumn: cell.col, gridRow: cell.row }}
    className={`palace-cell ${selected ? 'palace-cell--selected' : ''} ${harmony ? 'palace-cell--harmony' : ''} ${opposition ? 'palace-cell--opposition' : ''} ${dimmed ? 'palace-cell--dimmed' : ''}`}
    aria-pressed={selected}
    aria-label={`${localized} ${entry?.hanzi ?? ''} ${status}`}
    onClick={() => dispatch({ type: 'SELECT_PALACE', payload: palace.palaceId })}
  >
    {(palace.isMing || palace.isShen) && <span className="palace-cell__anchor-row">{palace.isMing && <span className="palace-cell__anchor palace-cell__anchor--ming">{t('atlas.badge.ming')}</span>}{palace.isShen && <span className="palace-cell__anchor palace-cell__anchor--shen">{t('atlas.badge.shen')}</span>}</span>}
    <span className="palace-cell__title">{localized}</span><span className="palace-cell__hanzi hanzi" lang="zh-Hant">{entry?.hanzi ?? '?'}</span><span className="palace-cell__pinyin">{entry?.pinyin ?? t('common.catalogueMissing')}</span><span className="palace-cell__stem-branch hanzi">{stem?.hanzi}{branch?.hanzi}</span>
    <span className="palace-cell__stars">{placements.map((placement) => <span key={placement.placementId} className="palace-cell__star-chip hanzi">{lookupStar(placement.starId)?.hanzi ?? '?'}</span>)}</span>
    {!placements.length && <span className="palace-cell__empty-note">{t('atlas.emptyPalace')}</span>}
    <span className="palace-cell__transformations">{placements.flatMap((placement) => placement.transformationTypes.map((type) => <span key={`${placement.placementId}:${type}`} className={`palace-cell__transformation palace-cell__transformation--${type.toLowerCase().replace('_','-')}`}>{lookupTransformation(type)?.hanzi ?? '?'}</span>))}</span>
  </button>;
}

function RelationLines() {
  const { state } = useApp();
  const report = state.report!;
  if (!state.selectedPalaceId) return null;
  const source = report.palaces.find((palace) => palace.palaceId === state.selectedPalaceId);
  if (!source) return null;
  const sourceCell = PALACE_GRID_LAYOUT.find((cell) => cell.branchId === source.branchId)!;
  const connections = relatedPalaces(report, state.selectedPalaceId);
  const targets = [...connections.harmony.map((id) => ({ id, kind: 'harmony' })), ...(connections.opposition ? [{ id: connections.opposition, kind: 'opposition' }] : [])];
  return <svg className="relation-svg" viewBox="0 0 4 4" preserveAspectRatio="none" aria-hidden="true">{targets.map(({ id, kind }) => {
    const palace = report.palaces.find((item) => item.palaceId === id)!;
    const cell = PALACE_GRID_LAYOUT.find((item) => item.branchId === palace.branchId)!;
    return <line key={id} x1={sourceCell.col - .5} y1={sourceCell.row - .5} x2={cell.col - .5} y2={cell.row - .5} className={`relation-line relation-line--${kind}`} vectorEffect="non-scaling-stroke"/>;
  })}</svg>;
}

export function PalaceGrid() {
  const { state, t } = useApp();
  const report = state.report!;
  return <div className="palace-atlas" role="group" aria-label={t('atlas.title')}><div className="palace-grid" data-testid="palace-grid">
    {report.palaces.map((palace) => <PalaceCell key={palace.palaceId} palace={palace}/>)}
    <div className="atlas-center" style={{ gridColumn: '2/4', gridRow: '2/4' }}><span className="atlas-center__label">MING · SHEN</span><strong>{report.anchors.mingBranchId} · {report.anchors.shenBranchId}</strong><span>{report.anchors.bureauId} · {report.anchors.bureauNumber}</span><SourceChip status={report.quality.sourceStatus} label={report.quality.sourceStatus}/></div>
    <RelationLines/>
  </div></div>;
}

function RelationSummary({ palaceId }: { palaceId: PalaceId }) {
  const { state, t } = useApp();
  const report = state.report!;
  const rel = relatedPalaces(report, palaceId);
  const title = (id: PalaceId) => { const entry = lookupPalace(id); return entry ? `${labelFor(entry, state.language)} · ${entry.hanzi}` : id; };
  return <div className="relation-text-summary"><p><b>{t('inspector.harmonyWith')}:</b> {rel.harmony.map(title).join(', ') || '—'}</p><p><b>{t('inspector.oppositionWith')}:</b> {rel.opposition ? title(rel.opposition) : '—'}</p></div>;
}

export function PalaceInspector() {
  const { state, dispatch, t } = useApp();
  const report = state.report!;
  const palaceId = state.selectedPalaceId ?? report.palaces[0].palaceId;
  const palace = report.palaces.find((item) => item.palaceId === palaceId)!;
  const entry = lookupPalace(palaceId);
  const placements = placementsForPalace(report, palaceId);
  return <aside className="inspector" aria-label={t('inspector.title')}>
    <h2 className="inspector__palace-title">{entry ? labelFor(entry, state.language) : palaceId}</h2><div className="inspector__hanzi hanzi" lang="zh-Hant">{entry?.hanzi}</div><div className="inspector__pinyin">{entry?.pinyin}</div>
    <div>{palace.isMing && <TruthBadge truthClass="CALCULATED_FACT" label={t('atlas.center.ming')}/>} {palace.isShen && <TruthBadge truthClass="CALCULATED_FACT" label={t('atlas.center.shen')}/>}</div>
    <section className="inspector__section"><h3 className="inspector__section-title">{t('inspector.stars')}</h3>{placements.length ? placements.map((placement) => { const star = lookupStar(placement.starId); return <div key={placement.placementId} className="inspector__star-item"><span className="inspector__star-hanzi hanzi">{star?.hanzi ?? '?'}</span><span>{star ? labelFor(star, state.language) : placement.starId}</span><code>{placement.placementId}</code>{placement.transformationTypes.map((type) => <span key={type} className="hanzi">{lookupTransformation(type)?.hanzi} · {type}</span>)}</div>; }) : <p>{t('atlas.emptyPalace')}</p>}</section>
    <RelationSummary palaceId={palaceId}/>
    <button className="btn btn--ghost btn--small" onClick={() => dispatch({ type: 'TOGGLE_EVIDENCE_DRAWER', payload: true })}>{t('evidence.openDrawer')}</button>
  </aside>;
}

export function DecadeTimeline() {
  const { state, dispatch, t } = useApp();
  const decades = state.report?.decades;
  if (!decades) return null;
  // Age-reckoning metadata is real calculation provenance (AC-012): the decade age
  // ranges are reckoned under this convention. Surface it from the model — never
  // hardcoded — so a decade selection preserves and shows it rather than dropping it.
  const ageReckoningId = state.report!.calculation.ageReckoningId;
  return <section className="report-layout__timeline"><h2 className="text-editorial">{t('decade.title')}</h2><div className="decade-timeline" role="tablist">{decades.map((decade) => <button key={decade.index} className={`decade-item ${state.selectedDecadeIndex === decade.index ? 'decade-item--selected' : ''}`} role="tab" aria-selected={state.selectedDecadeIndex === decade.index} onClick={() => { dispatch({ type: 'SELECT_DECADE', payload: decade.index }); dispatch({ type: 'SELECT_PALACE', payload: decade.palaceId }); }}><span className="decade-item__age">{decade.ageStart}–{decade.ageEnd}</span><span className="hanzi">{lookupPalace(decade.palaceId)?.hanzi}</span></button>)}</div>{ageReckoningId && <p className="decade-timeline__age-reckoning">{t('decade.ageReckoning')}: <code>{ageReckoningId}</code></p>}<p>{t('decade.disclaimer')}</p></section>;
}

export function MobilePalaceNavigator() {
  const { state, dispatch, t } = useApp();
  const report = state.report!;
  const current = Math.max(0, report.palaces.findIndex((palace) => palace.palaceId === state.selectedPalaceId));
  const palace = report.palaces[current];
  const entry = lookupPalace(palace.palaceId);
  const move = (delta: number) => dispatch({ type: 'SELECT_PALACE', payload: report.palaces[(current + delta + 12) % 12].palaceId });
  return <div className="mobile-navigator"><article className="mobile-navigator__card"><h2>{entry ? labelFor(entry, state.language) : palace.palaceId}</h2><div className="inspector__hanzi hanzi">{entry?.hanzi}</div><div>{entry?.pinyin}</div><PalaceInspector/><div className="mobile-navigator__controls"><button className="btn btn--ghost" onClick={() => move(-1)}>← {t('common.previous')}</button><button className="btn btn--secondary" onClick={() => dispatch({ type: 'SET_MOBILE_MAP_DIALOG', payload: true })}>{t('common.openFullMap')}</button><button className="btn btn--ghost" onClick={() => move(1)}>{t('common.next')} →</button></div></article></div>;
}

export function MobileMapDialog() {
  const { state, dispatch, t } = useApp();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!state.mobileMapDialogOpen) return;
    restoreRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && dispatch({ type: 'SET_MOBILE_MAP_DIALOG', payload: false });
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; restoreRef.current?.focus(); };
  }, [state.mobileMapDialogOpen, dispatch]);
  if (!state.mobileMapDialogOpen) return null;
  return <div className="map-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="map-title"><div className="map-dialog"><div className="map-dialog__header"><h2 id="map-title">{t('mobile.dialogTitle')}</h2><button ref={closeRef} className="map-dialog__close" onClick={() => dispatch({ type: 'SET_MOBILE_MAP_DIALOG', payload: false })}>{t('common.close')}</button></div><PalaceGrid/></div></div>;
}

export function PalaceWorkspace() {
  return <><div className="report-layout__atlas"><PalaceGrid/><MobilePalaceNavigator/></div><div className="report-layout__inspector"><PalaceInspector/></div><DecadeTimeline/><MobileMapDialog/></>;
}