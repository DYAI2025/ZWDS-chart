import { useApp } from '@/app/appContext';
import { FEATURE_FLAGS } from '@/app/featureFlags';
import { GuidedSummary } from './GuidedSummary';
import { GuidedRelations } from './GuidedRelations';
import { GuidedLifePhase } from './GuidedLifePhase';
import { GuidedReflection } from './GuidedReflection';

// Guided container — stacks the Western-adaptation iteration sections, each behind its own
// feature flag, and keeps a single always-present path back to the traditional atlas
// (REQ-F-002/901). Removing any flag removes that layer without touching calculation data.
export function GuidedView() {
  const { dispatch, t } = useApp();
  return (
    <section className="guided-view" style={{ gridColumn: '1/-1' }} data-testid="guided-view">
      {FEATURE_FLAGS.guidedSummary && <GuidedSummary />}
      {FEATURE_FLAGS.guidedRelations && <GuidedRelations />}
      {FEATURE_FLAGS.guidedLifePhase && <GuidedLifePhase />}
      {FEATURE_FLAGS.guidedReflection && <GuidedReflection />}
      <button
        className="btn btn--secondary"
        data-testid="guided-to-traditional"
        onClick={() => dispatch({ type: 'SET_REPORT_SUB_VIEW', payload: 'atlas' })}
      >
        {t('guided.toTraditional')}
      </button>
    </section>
  );
}
