import { useEffect } from 'react';
import { useApp, t as translate } from './appContext';
import { useAriaAnnouncement } from '@/hooks';
import { AtlasNavigation, StatusStrip } from '@/components/navigation/AtlasNavigation';
import { AtlasLanding } from '@/components/hero/AtlasLanding';
import { BirthIntakeWizard } from '@/components/intake/BirthIntakeWizard';
import { ReportWorkspace } from '@/components/report/ReportWorkspace';
import type { PalaceId } from '@/domain/zwdsTypes';
import { relatedPalaces } from '@/domain/zwdsTypes';
import { lookupPalace } from '@/data/zwdsCatalog';

export function AppShell() {
  const { state, dispatch, t } = useApp();
  const { announce, liveRegionProps } = useAriaAnnouncement();
  // AC-016 / REQ-008: the atlas live region must announce the SELECTION *and* its
  // calculated relationships (harmony / opposition palaces) — not only the palace
  // name — so a non-sighted user hears the network structure the coloured cells and
  // relation lines convey visually. `translate` is the stable module-level localiser
  // (the context `t` is re-created each render), keeping this effect keyed to the
  // selection/language/report and not firing on every render.
  useEffect(() => {
    const report = state.report;
    if (!state.selectedPalaceId || !report) return;
    const entry = lookupPalace(state.selectedPalaceId);
    if (!entry) return;
    const nameOf = (id: PalaceId) => {
      const related = lookupPalace(id);
      return related ? (state.language === 'de' ? related.de : related.en) : id;
    };
    const relations = relatedPalaces(report, state.selectedPalaceId);
    const parts = [`${state.language === 'de' ? entry.de : entry.en} · ${entry.hanzi} · ${entry.pinyin}`];
    if (relations.harmony.length) {
      parts.push(`${translate('inspector.harmonyWith', state.language)}: ${relations.harmony.map(nameOf).join(', ')}`);
    }
    if (relations.opposition) {
      parts.push(`${translate('inspector.oppositionWith', state.language)}: ${nameOf(relations.opposition)}`);
    }
    announce(parts.join('. '));
  }, [state.selectedPalaceId, state.language, state.report, announce]);
  return <div className="app-shell"><div {...liveRegionProps} data-testid="atlas-live-region"/><a href="#main-content" className="skip-link">{t('nav.skipToContent')}</a><AtlasNavigation/>{state.view === 'report' && <StatusStrip/>}<div id="main-content" className="main-content">{state.view === 'landing' && <AtlasLanding/>}{state.view === 'intake' && <BirthIntakeWizard/>}{state.view === 'loading' && <div className="loading" role="status"><div className="loading__spinner"/><h1>{t('loading.title')}</h1><p>{t('loading.description')}</p></div>}{state.view === 'report' && state.report && <ReportWorkspace/>}{state.view === 'error' && <div className="error-view" role="alert"><h1>{t('error.provider')}</h1><p>{state.providerErrorCode}: {state.providerError}</p><button className="btn btn--primary" onClick={() => dispatch({ type: 'RESET_TO_INTAKE' })}>{t('error.backToIntake')}</button></div>}</div></div>;
}