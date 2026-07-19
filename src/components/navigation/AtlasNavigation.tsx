import { useState } from 'react';
import { useApp } from '@/app/appContext';
import type { ReportSubView } from '@/app/appReducer';
import { createProvider } from '@/app/providerFactory';
import { FEATURE_FLAGS } from '@/app/featureFlags';

// Guided tab leads when enabled; the traditional sub-views always remain reachable.
const REPORT_TABS: ReportSubView[] = [
  ...(FEATURE_FLAGS.guidedSummary ? (['guided'] as ReportSubView[]) : []),
  'atlas', 'reading', 'evidence', 'method',
];

export function AtlasNavigation() {
  const { state, dispatch, t } = useApp();
  const [pdfError, setPdfError] = useState<string | null>(null);
  const isReport = state.view === 'report';

  const downloadPdf = async () => {
    setPdfError(null);
    if (!state.reportToken) { window.print(); return; }
    try {
      const provider = createProvider();
      if (!provider.createPdf) { window.print(); return; }
      const blob = await provider.createPdf(state.reportToken, state.language === 'de' ? 'de-DE' : 'en-US');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `bazodiac-${state.report?.calculation.chartFingerprint ?? 'report'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError(t('error.pdfUnavailable'));
    }
  };

  return <>
    <nav className="atlas-nav" aria-label="Main navigation"><div className="atlas-nav__inner">
      <span className="atlas-nav__brand text-editorial">BaZodiac</span>
      {isReport && <div className="atlas-nav__links" role="tablist" aria-label="Report views">
        {REPORT_TABS.map((sub) => <button key={sub} role="tab" aria-selected={state.reportSubView === sub} className={`atlas-nav__link ${state.reportSubView === sub ? 'atlas-nav__link--active' : ''}`} onClick={() => dispatch({ type: 'SET_REPORT_SUB_VIEW', payload: sub })}>{t(`nav.${sub}`)}</button>)}
      </div>}
      <span style={{ flex: 1 }} />
      <div className="atlas-nav__actions">
        {isReport && <button className="btn btn--ghost btn--small" onClick={downloadPdf}>{state.reportToken ? t('nav.pdf') : t('nav.print')}</button>}
        <div className="lang-switch" role="radiogroup" aria-label="Language">
          {(['de','en'] as const).map((lang) => <button key={lang} className={`lang-switch__btn ${state.language === lang ? 'lang-switch__btn--active' : ''}`} onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: lang })} role="radio" aria-checked={state.language === lang}>{lang.toUpperCase()}</button>)}
        </div>
      </div>
    </div></nav>
    {pdfError && <div role="alert" className="pdf-alert">{pdfError} <button onClick={() => window.print()}>{t('nav.print')}</button></div>}
  </>;
}

export function StatusStrip() {
  const { state, t } = useApp();
  const report = state.report;
  if (!report) return null;
  const c = report.calculation;
  // tabIndex=0: on mobile the strip becomes a horizontal scroll container (overflow-x:auto)
  // with no focusable children, so it must be keyboard-focusable to be scrollable by keyboard
  // (WCAG 2.1.1 / axe scrollable-region-focusable). REQ-016B.
  return <div className={`status-strip ${c.dataMode === 'fixture' ? 'status-strip--demo' : ''}`} role="status" aria-label={t('status.ariaLabel')} tabIndex={0}>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.calculation')}:</span><b>{c.calculationStatus}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.dataMode')}:</span><b>{c.dataMode}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.ruleset')}:</span><b>{c.rulesetId} · {c.rulesetVersion}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.sourceStatus')}:</span><b>{c.sourceStatus}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">Crosscheck:</span><b>{c.crosscheckStatus}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.humanReview')}:</span><b>{c.humanReviewRequired ? t('status.humanReview.yes') : t('status.humanReview.no')}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.schoolProfile')}:</span><b>{report.schoolProfileStatus}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">{t('status.scriptPolicy')}:</span><b>{report.scriptPolicy}</b></span>
    <span className="status-strip__item"><span className="status-strip__label">Fingerprint:</span><b>{c.chartFingerprint}</b></span>
  </div>;
}