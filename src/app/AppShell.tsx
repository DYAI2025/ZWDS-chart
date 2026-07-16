import { useEffect } from 'react';
import { useApp } from './appContext';
import { useAriaAnnouncement } from '@/hooks';
import { AtlasNavigation, StatusStrip } from '@/components/navigation/AtlasNavigation';
import { AtlasLanding } from '@/components/hero/AtlasLanding';
import { BirthIntakeWizard } from '@/components/intake/BirthIntakeWizard';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import { lookupPalace } from '@/data/zwdsCatalog';

export function AppShell() {
  const { state, dispatch, t } = useApp();
  const { announce, liveRegionProps } = useAriaAnnouncement();
  useEffect(() => {
    if (!state.selectedPalaceId) return;
    const entry = lookupPalace(state.selectedPalaceId);
    if (entry) announce(`${state.language === 'de' ? entry.de : entry.en} · ${entry.hanzi} · ${entry.pinyin}`);
  }, [state.selectedPalaceId, state.language, announce]);
  return <div className="app-shell"><div {...liveRegionProps}/><a href="#main-content" className="skip-link">{t('nav.skipToContent')}</a><AtlasNavigation/>{state.view === 'report' && <StatusStrip/>}<div id="main-content" className="main-content">{state.view === 'landing' && <AtlasLanding/>}{state.view === 'intake' && <BirthIntakeWizard/>}{state.view === 'loading' && <div className="loading" role="status"><div className="loading__spinner"/><h1>{t('loading.title')}</h1><p>{t('loading.description')}</p></div>}{state.view === 'report' && state.report && <ReportWorkspace/>}{state.view === 'error' && <div className="error-view" role="alert"><h1>{t('error.provider')}</h1><p>{state.providerErrorCode}: {state.providerError}</p><button className="btn btn--primary" onClick={() => dispatch({ type: 'RESET_TO_INTAKE' })}>{t('error.backToIntake')}</button></div>}</div></div>;
}