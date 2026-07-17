import { useCallback, useMemo } from 'react';
import { useApp } from '@/app/appContext';
import { isFixtureMode } from '@/app/providerFactory';
import { demoPrefill } from '@/domain/intakeTypes';
import { useDocumentVisibility, usePrefersReducedMotion } from '@/hooks';
import { SectionHeading } from '@/components/common/ReportPrimitives';

export function AtlasLanding() {
  const { dispatch, t } = useApp();
  const reduced = usePrefersReducedMotion();
  const visible = useDocumentVisibility();
  const motionStyle = useMemo(() => ({ animationPlayState: reduced || !visible ? ('paused' as const) : ('running' as const) }), [reduced, visible]);
  const open = useCallback(() => {
    dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: demoPrefill() });
    dispatch({ type: 'SET_INTAKE_STEP', payload: 0 });
    dispatch({ type: 'SET_VIEW', payload: 'intake' });
  }, [dispatch]);
  const cards = ['chart-core','transformations','palace-network','decades','evidence','method'];
  return <>
    <section className="hero"><div className="mineral-backdrop" aria-hidden="true"><div className="mineral-circle mineral-circle--dark" style={motionStyle}/><div className="mineral-circle mineral-circle--timberwolf" style={motionStyle}/><div className="mineral-circle mineral-circle--umber" style={motionStyle}/><div className="mineral-circle mineral-circle--gold" style={motionStyle}/><div className="mineral-line" style={motionStyle}/><div className="mineral-grain"/></div>
      <div className="hero__content"><p className="hero__eyebrow">BaZodiac</p><h1 className="hero__title text-editorial">{t('hero.title')}</h1><p className="hero__description">{t('hero.description')}</p><div className="hero__actions"><button className="btn btn--primary" onClick={open}>{t('hero.cta.primary')}</button><button className="btn btn--secondary" onClick={open}>{t('hero.cta.secondary')}</button></div>{isFixtureMode() && <p className="hero__demo-note">{t('hero.demoNote')}</p>}</div>
    </section>
    <section className="section section--dark"><div className="container"><SectionHeading eyebrow="BaZodiac" title={t('app.subtitle')}/><div className="bento">{cards.map((id) => <article key={id} className={`bento-card ${id === 'palace-network' ? 'bento-card--featured' : ''}`}><div className="bento-card__content"><p className="bento-card__eyebrow">{t(`bento.${id}.eyebrow`)}</p><h3 className="bento-card__title">{t(`bento.${id}.title`)}</h3><p className="bento-card__description">{t(`bento.${id}.description`)}</p></div></article>)}</div></div></section>
  </>;
}