import { useState } from 'react';
import { useApp } from '@/app/appContext';
import { buildReflection, REFLECTION_THEMES, type ReflectionTheme } from '@/domain/reflection';
import type { PalaceId, StarId } from '@/domain/zwdsTypes';
import { labelFor, lookupPalace, lookupStar } from '@/data/zwdsCatalog';
import { TruthBadge } from '@/components/common/ReportPrimitives';

// Iteration 4 — evidence-bound reflection (deterministic). A theme maps to concrete chart
// entities; the answer stays bound to them and never becomes a guarantee/diagnosis/destiny
// claim (deterministic templates + a red-team test enforce this). Persistence is OFF until a
// deletion policy exists. The server LLM path stays disabled regardless of this flag.

function palaceName(palaceId: PalaceId, language: 'de' | 'en'): string {
  const entry = lookupPalace(palaceId);
  return (entry && labelFor(entry, language)) || palaceId;
}

export function GuidedReflection() {
  const { state, dispatch, t } = useApp();
  const report = state.report!;
  const [theme, setTheme] = useState<ReflectionTheme | null>(null);
  const answer = theme ? buildReflection(report, theme) : null;

  const openEvidence = (palaceId: PalaceId) => {
    dispatch({ type: 'SELECT_PALACE', payload: palaceId });
    dispatch({ type: 'TOGGLE_EVIDENCE_DRAWER', payload: true });
  };

  return (
    <section className="guided-module guided-reflect" aria-label={t('guided.reflect.title')} data-testid="guided-reflect">
      <h2 className="guided-module__title">{t('guided.reflect.title')}</h2>
      <p>{t('guided.reflect.intro')}</p>

      <div className="guided-reflect__themes" role="group" aria-label={t('guided.reflect.title')}>
        {REFLECTION_THEMES.map((option) => (
          <button
            key={option}
            className={`btn btn--small ${theme === option ? 'btn--secondary' : 'btn--ghost'}`}
            aria-pressed={theme === option}
            data-testid={`guided-reflect-theme-${option}`}
            onClick={() => setTheme(option)}
          >
            {t(`guided.theme.${option}`)}
          </button>
        ))}
      </div>

      {answer && (answer.status === 'OUT_OF_SCOPE' ? (
        <div className="guided-reflect__answer" data-testid="guided-reflect-out-of-scope">
          <p>{t('guided.reflect.outOfScope')}</p>
          {answer.alternativePalaceId && (
            <button className="btn btn--ghost btn--small" onClick={() => openEvidence(answer.alternativePalaceId!)}>
              {palaceName(answer.alternativePalaceId, state.language)}
            </button>
          )}
        </div>
      ) : (
        <div className="guided-reflect__answer" data-testid="guided-reflect-answer">
          <h3 className="guided-module__subtitle">{t('guided.reflect.answerBasis')}</h3>
          <p className="guided-reflect__basis" data-testid="guided-reflect-basis">
            <b>{palaceName(answer.palaceId, state.language)}</b>
            {answer.chartReferences.starIds.length > 0 && (
              <> · {answer.chartReferences.starIds.map((starId) => starName(starId, state.language)).join(', ')}</>
            )}
          </p>
          <p className="guided-reflect__limit"><b>{t('guided.reflect.limit')}:</b> {t('guided.reflect.limitBody')}</p>
          <p className="guided-reflect__followup"><b>{t('guided.reflect.followUp')}:</b> {t('guided.phase.q1')}</p>
          <div className="guided-reflect__meta">
            <TruthBadge truthClass={answer.truthClass} label={t('truth.REFLECTIVE_HYPOTHESIS')} />
            <button className="btn btn--ghost btn--small" onClick={() => openEvidence(answer.palaceId)}>{t('guided.howCalculated')}</button>
          </div>
        </div>
      ))}

      <p className="guided-notice" role="note" data-testid="guided-reflect-persistence-off">{t('guided.reflect.persistenceOff')}</p>
    </section>
  );
}

function starName(starId: StarId, language: 'de' | 'en'): string {
  const star = lookupStar(starId);
  return (star && labelFor(star, language)) || starId;
}
