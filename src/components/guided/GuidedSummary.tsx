import { useApp } from '@/app/appContext';
import { computePalaceProminence, type ProminentPalace } from '@/domain/palaceProminence';
import { placementsForPalace } from '@/domain/zwdsTypes';
import { labelFor, lookupPalace } from '@/data/zwdsCatalog';
import { SourceChip, TruthBadge } from '@/components/common/ReportPrimitives';

// Iteration 1 — Guided Summary. A plain-language PRODUCT_TRANSLATION layer over the same
// calculated report: personal core (Ming) + up to three prominent palaces, each with the
// evidence that selected it and a path to "how was this calculated?". Never a strength claim.
// docs/plans/2026-07-19-zwds-western-adaptation-4-iterations.md — Iteration 1.

function joinNatural(parts: string[], conjunction: string): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} ${conjunction} ${parts[parts.length - 1]}`;
}

function palaceTitle(palaceId: ProminentPalace['palaceId'], language: 'de' | 'en'): { title: string; hanzi: string } {
  const entry = lookupPalace(palaceId);
  return { title: (entry && labelFor(entry, language)) || palaceId, hanzi: entry?.hanzi ?? '' };
}

function ProminentCard({ palace }: { palace: ProminentPalace }) {
  const { state, dispatch, t } = useApp();
  const { title, hanzi } = palaceTitle(palace.palaceId, state.language);
  const why = joinNatural(palace.signals.map((signal) => t(`guided.signal.${signal.kind}`)), t('guided.conj'));
  const openEvidence = () => {
    dispatch({ type: 'SELECT_PALACE', payload: palace.palaceId });
    dispatch({ type: 'TOGGLE_EVIDENCE_DRAWER', payload: true });
  };
  return (
    <article className="guided-card" data-testid={`guided-prominent-${palace.palaceId}`}>
      <h3 className="guided-card__title">
        {title} <span className="hanzi" lang="zh-Hant">{hanzi}</span>
      </h3>
      <p className="guided-card__domain">{t(`guided.palace.${palace.palaceId}`)}</p>
      <p className="guided-card__why"><b>{t('guided.card.why')}:</b> {t('guided.why.prefix')} {why}.</p>
      {palace.tiedWithNext && <p className="guided-card__equal">{t('guided.card.equal')}</p>}
      <div className="guided-card__meta">
        <TruthBadge truthClass="PRODUCT_TRANSLATION" label={t('guided.claimType')} />
        <SourceChip status={palace.sourceStatus} label={palace.sourceStatus} />
      </div>
      <button className="btn btn--ghost btn--small" onClick={openEvidence}>{t('guided.howCalculated')}</button>
    </article>
  );
}

export function GuidedSummary() {
  const { state, t } = useApp();
  const report = state.report!;
  const model = computePalaceProminence(report);
  const mingEmpty = placementsForPalace(report, model.personalCore?.palaceId ?? 'MING').length === 0;
  const coreTitle = model.personalCore ? palaceTitle(model.personalCore.palaceId, state.language) : null;

  return (
    <section className="guided-summary" style={{ gridColumn: '1/-1' }} aria-label={t('guided.title')}>
      <h1 className="guided-summary__title text-editorial">{t('guided.title')}</h1>

      {/* Personal core (Ming) — CALCULATED, shown separately from the prominence slots. */}
      <section className="guided-module" aria-label={t('guided.core.title')}>
        <h2 className="guided-module__title">{t('guided.core.title')}</h2>
        {coreTitle && (
          <p className="guided-core__name">
            <b>{coreTitle.title}</b> <span className="hanzi" lang="zh-Hant">{coreTitle.hanzi}</span>
          </p>
        )}
        <p>{t('guided.core.body')}</p>
        {mingEmpty && <p className="guided-core__empty">{t('guided.core.emptyMing')}</p>}
        <TruthBadge truthClass="CALCULATED_FACT" label={t('truth.CALCULATED_FACT')} />
      </section>

      {/* Prominent palaces — PRODUCT_TRANSLATION, at most three. */}
      <section className="guided-module" aria-label={t('guided.prominent.title')}>
        <h2 className="guided-module__title">{t('guided.prominent.title')}</h2>
        <p>{t('guided.prominent.intro')}</p>
        {model.equalGroupTruncated && <p className="guided-module__note" role="note">{t('guided.prominent.equalGroup')}</p>}
        {model.prominentPalaces.length === 0 ? (
          <p className="guided-module__empty">{t('guided.prominent.none')}</p>
        ) : (
          <div className="guided-cards" data-testid="guided-prominent-cards">
            {model.prominentPalaces.map((palace) => <ProminentCard key={palace.palaceId} palace={palace} />)}
          </div>
        )}
        {/* The one meaning users must not miss: prominent is not a verdict. */}
        <p className="guided-notice" role="note" data-testid="guided-not-verdict">{t('guided.notVerdict')}</p>
      </section>
    </section>
  );
}
