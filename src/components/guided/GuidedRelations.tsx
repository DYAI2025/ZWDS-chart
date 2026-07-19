import { useApp } from '@/app/appContext';
import { buildGuidedRelations, type GuidedRelationEdge } from '@/domain/palaceRelations';
import { computePalaceProminence } from '@/domain/palaceProminence';
import type { PalaceId } from '@/domain/zwdsTypes';
import { labelFor, lookupPalace } from '@/data/zwdsCatalog';
import { TruthBadge } from '@/components/common/ReportPrimitives';

// Iteration 2 — plain-language relationships. A text-first view (no colour dependency;
// the whole thing is a list, so it works for screen readers and PDF — REQ-NF-101/102).
// Relations are CALCULATED_FACT; nothing is invented (buildGuidedRelations fail-closes on
// unresolved evidence). Empty state is honest, not a fabricated connection.

function palaceName(palaceId: PalaceId, language: 'de' | 'en'): string {
  const entry = lookupPalace(palaceId);
  return (entry && labelFor(entry, language)) || palaceId;
}

export function GuidedRelations() {
  const { state, dispatch, t } = useApp();
  const report = state.report!;
  const prominence = computePalaceProminence(report);
  const focusId: PalaceId = state.selectedPalaceId ?? prominence.personalCore?.palaceId ?? report.palaces[0].palaceId;
  const model = buildGuidedRelations(report, focusId);

  // Selector: the personal core plus the prominent palaces — the areas a user most likely
  // wants to explore from.
  const selectable: PalaceId[] = [
    ...(prominence.personalCore ? [prominence.personalCore.palaceId] : []),
    ...prominence.prominentPalaces.map((palace) => palace.palaceId),
  ].filter((id, index, all) => all.indexOf(id) === index);

  const nameList = (edges: GuidedRelationEdge[]): string =>
    edges.map((edge) => palaceName(edge.palaceId, state.language)).join(', ');

  return (
    <section className="guided-module guided-relations" aria-label={t('guided.relations.title')} data-testid="guided-relations">
      <h2 className="guided-module__title">{t('guided.relations.title')}</h2>
      <p>{t('guided.relations.intro')}</p>

      <div className="guided-relations__selector" role="group" aria-label={t('guided.relations.title')}>
        {selectable.map((id) => (
          <button
            key={id}
            className={`btn btn--small ${id === focusId ? 'btn--secondary' : 'btn--ghost'}`}
            aria-pressed={id === focusId}
            data-testid={`guided-relation-focus-${id}`}
            onClick={() => dispatch({ type: 'SELECT_PALACE', payload: id })}
          >
            {palaceName(id, state.language)}
          </button>
        ))}
      </div>

      <p className="guided-relations__focus"><b>{palaceName(focusId, state.language)}</b></p>

      {!model.hasAny ? (
        <p className="guided-module__empty" data-testid="guided-relations-none">{t('guided.relations.none')}</p>
      ) : (
        <div className="guided-relations__edges">
          {model.harmony.length > 0 && (
            <div className="guided-relations__block" data-testid="guided-relations-harmony">
              <h3 className="guided-relations__label">{t('guided.relations.harmony')}: {nameList(model.harmony)}</h3>
              <p>{t('guided.relations.harmonyExplain')}</p>
            </div>
          )}
          {model.opposition && (
            <div className="guided-relations__block" data-testid="guided-relations-opposition">
              <h3 className="guided-relations__label">{t('guided.relations.opposition')}: {palaceName(model.opposition.palaceId, state.language)}</h3>
              <p>{t('guided.relations.oppositionExplain')}</p>
            </div>
          )}
          <TruthBadge truthClass={model.truthClass} label={t('truth.CALCULATED_FACT')} />
        </div>
      )}
    </section>
  );
}
