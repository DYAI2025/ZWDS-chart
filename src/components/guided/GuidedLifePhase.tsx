import { useApp } from '@/app/appContext';
import { ageBetween, buildLifePhase } from '@/domain/lifePhase';
import type { PalaceId } from '@/domain/zwdsTypes';
import { labelFor, lookupPalace } from '@/data/zwdsCatalog';
import { TruthBadge } from '@/components/common/ReportPrimitives';

// Iteration 3 — "Your current life chapter". Distinguishes the unchanging birth chart from
// the active decade overlay. The decade is CALCULATED (report.decades); the current one is
// resolved from the person's real age against calculated windows, never guessed. When it
// cannot be resolved, the missing basis is named (fail-closed) — no fabricated chapter.

function palaceName(palaceId: PalaceId, language: 'de' | 'en'): string {
  const entry = lookupPalace(palaceId);
  return (entry && labelFor(entry, language)) || palaceId;
}

// Injectable for deterministic tests; defaults to the real current date in the browser.
export function GuidedLifePhase({ currentAgeOverride }: { currentAgeOverride?: number | null } = {}) {
  const { state, t } = useApp();
  const report = state.report!;
  const todayIso = new Date().toISOString().slice(0, 10);
  const age = currentAgeOverride ?? ageBetween(report.birthInputSummary.date, todayIso);
  const model = buildLifePhase(report, age);

  return (
    <section className="guided-module guided-phase" aria-label={t('guided.phase.title')} data-testid="guided-phase">
      <h2 className="guided-module__title">{t('guided.phase.title')}</h2>
      <p>{t('guided.phase.intro')}</p>

      <div className="guided-phase__compare">
        <div className="guided-phase__col"><b>{t('guided.phase.baseChart')}</b></div>
        <div className="guided-phase__col"><b>{t('guided.phase.overlay')}</b></div>
      </div>

      {model.status === 'UNKNOWN' ? (
        <p className="guided-module__empty" data-testid="guided-phase-unknown">{t('guided.phase.unknown')}</p>
      ) : (
        <div className="guided-phase__resolved" data-testid="guided-phase-resolved">
          <p className="guided-phase__foreground">
            <b>{palaceName(model.palaceId!, state.language)}</b> {t('guided.phase.foreground')}.
          </p>
          <p>{t('guided.phase.range')}: <b>{model.currentDecade!.ageStart}–{model.currentDecade!.ageEnd}</b></p>
          {model.ageReckoningId && (
            <p className="guided-phase__reckoning">{t('guided.phase.ageReckoning')}: <code>{model.ageReckoningId}</code></p>
          )}
          <p className="guided-notice" role="note" data-testid="guided-phase-not-event">{t('guided.phase.notEvent')}</p>
          <div className="guided-phase__reflect">
            <h3 className="guided-module__subtitle">{t('guided.phase.reflectTitle')}</h3>
            <ul>
              <li>{t('guided.phase.q1')}</li>
              <li>{t('guided.phase.q2')}</li>
            </ul>
          </div>
          <TruthBadge truthClass={model.truthClass} label={t('truth.CALCULATED_FACT')} />
        </div>
      )}
    </section>
  );
}
