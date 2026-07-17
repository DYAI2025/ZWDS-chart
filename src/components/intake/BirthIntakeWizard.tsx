import { useCallback, useMemo, useRef, useState } from 'react';
import { useApp } from '@/app/appContext';
import { createProvider, isFixtureMode } from '@/app/providerFactory';
import {
  DEMO_PROFILE, deviatesFromDemo, toBirthInput, validateIntakeStep,
  type ValidationError,
} from '@/domain/intakeTypes';
import type { GeocodeResult } from '@/domain/zwdsTypes';
import { ProviderError } from '@/services/MockZwdsProvider';

const STEP_KEYS = ['intake.step.date','intake.step.location','intake.step.method','intake.step.preferences','intake.step.review'];

export function BirthIntakeWizard() {
  const { state, dispatch, t } = useApp();
  const values = state.intakeValues;
  const provider = useMemo(() => createProvider(), []);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [candidate, setCandidate] = useState<GeocodeResult | null>(null);
  const [searching, setSearching] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const focusErrors = useCallback((nextErrors: ValidationError[]) => {
    setErrors(nextErrors);
    requestAnimationFrame(() => {
      summaryRef.current?.focus();
      const first = nextErrors[0]?.field;
      if (first) document.getElementById(`field-${first}`)?.focus();
    });
  }, []);

  const next = () => {
    const nextErrors = validateIntakeStep(state.intakeStep, values);
    if (nextErrors.length) { focusErrors(nextErrors); return; }
    setErrors([]);
    dispatch({ type: 'SET_INTAKE_STEP', payload: Math.min(4, state.intakeStep + 1) });
  };

  const search = async () => {
    if (values.placeQuery.trim().length < 2) { focusErrors([{ field: 'placeQuery', messageKey: 'validation.required' }]); return; }
    setSearching(true);
    try { setResults(await provider.geocode(values.placeQuery, state.language)); }
    catch { focusErrors([{ field: 'placeQuery', messageKey: 'error.provider' }]); }
    finally { setSearching(false); }
  };

  const calculate = async () => {
    const input = toBirthInput(values);
    if (!input) { focusErrors([{ field: 'location', messageKey: 'validation.required' }]); return; }
    dispatch({ type: 'START_CALCULATION' });
    try {
      const result = await provider.calculate(input);
      dispatch({ type: 'CALCULATION_SUCCESS', payload: result });
    } catch (error) {
      const providerError = error instanceof ProviderError ? error : null;
      dispatch({ type: 'CALCULATION_ERROR', payload: { code: providerError?.code ?? 'UNKNOWN', message: providerError?.message ?? t('error.generic') } });
    }
  };

  const errorFor = (field: string) => errors.find((error) => error.field === field);
  const updateDemo = (patch: Partial<typeof values>) => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { ...patch, demoModified: true } });

  return <section className="intake"><div className="container-narrow">
    <header className="intake__header">{isFixtureMode() && <p className="demo-banner" role="note">{t('intake.demoBanner')}</p>}<h1 className="text-editorial">{t('intake.title')}</h1>
      <div className="intake__progress" role="tablist" aria-label={t('intake.stepsAria')}>{STEP_KEYS.map((key, index) => <button key={key} role="tab" aria-selected={index === state.intakeStep} className={`intake__step-indicator ${index === state.intakeStep ? 'intake__step-indicator--active' : ''}`} onClick={() => index <= state.intakeStep && dispatch({ type: 'SET_INTAKE_STEP', payload: index })}>{index + 1}. {t(key)}</button>)}</div>
    </header>
    <div className="intake__body">
      {errors.length > 0 && <div ref={summaryRef} className="form-error-summary" role="alert" tabIndex={-1}><h2>{t('validation.summary')}</h2><ul>{errors.map((error) => <li key={error.field}><a href={`#field-${error.field}`}>{t(error.messageKey)}</a></li>)}</ul></div>}

      {state.intakeStep === 0 && <div role="tabpanel"><h2 className="intake__step-title">{t(STEP_KEYS[0])}</h2>
        <Field label={t('intake.birthDate')} id="field-date" error={errorFor('date') ? t('validation.required') : null}><input id="field-date" className="intake__input" type="date" value={values.date} onChange={(event) => updateDemo({ date: event.target.value })}/></Field>
        <Field label={t('intake.birthTime')} id="field-time" error={errorFor('time') ? t('validation.required') : null}><input id="field-time" className="intake__input" type="time" value={values.time} onChange={(event) => updateDemo({ time: event.target.value })}/></Field>
        <fieldset className="intake__field"><legend className="intake__label">{t('intake.sexAtBirth')}</legend><div className="intake__radio-group">{(['male','female'] as const).map((sex) => <label key={sex} className="intake__radio-label"><input type="radio" name="sex" checked={values.sexAtBirth === sex} onChange={() => updateDemo({ sexAtBirth: sex })}/>{t(`intake.sexAtBirth.${sex}`)}</label>)}</div></fieldset>
      </div>}

      {state.intakeStep === 1 && <div role="tabpanel"><h2 className="intake__step-title">{t(STEP_KEYS[1])}</h2>
        <Field label={t('intake.location.search')} id="field-placeQuery" error={errorFor('placeQuery') ? t('validation.required') : null}><div className="location-search-row"><input id="field-placeQuery" className="intake__input" value={values.placeQuery} onChange={(event) => updateDemo({ placeQuery: event.target.value, location: null })}/><button className="btn btn--secondary" onClick={search} disabled={searching}>{searching ? t('loading.title') : t('intake.location.search')}</button></div></Field>
        {results.length > 0 && <div className="intake__location-results" role="listbox">{results.map((result) => <button key={`${result.providerId}:${result.lat}:${result.lon}`} role="option" aria-selected={candidate === result} className="intake__location-result" onClick={() => setCandidate(result)}>{result.displayName} · {result.timezone}</button>)}</div>}
        {candidate && <div className="intake__confirmed-location"><p><strong>{candidate.displayName}</strong><br/>{candidate.lat}, {candidate.lon}<br/>{candidate.timezone}<br/>{candidate.providerId}</p><button id="field-location" className="btn btn--primary" onClick={() => { updateDemo({ location: { displayName: candidate.displayName, lat: candidate.lat, lon: candidate.lon, timezone: candidate.timezone, confirmed: true } }); setResults([]); }}>{t('intake.location.confirm')}</button></div>}
        {values.location && <p className="intake__mock-notice">{t('intake.location.confirmedAria')}: {values.location.displayName} · {values.location.timezone}</p>}
        {errorFor('location') && <p className="intake__error">{t('intake.location.required')}</p>}
      </div>}

      {state.intakeStep === 2 && <div role="tabpanel"><h2 className="intake__step-title">{t(STEP_KEYS[2])}</h2>
        <fieldset className="intake__field"><legend className="intake__label">{t('intake.directionMethod.label')}</legend><div className="intake__radio-group">{(['year_stem_yinyang_and_sex','explicit','omit'] as const).map((method) => <label key={method} className="intake__radio-label"><input type="radio" name="method" checked={values.directionMethod === method} onChange={() => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { directionMethod: method } })}/>{t(`intake.directionMethod.${method}`)}</label>)}</div></fieldset>
        {values.directionMethod === 'explicit' && <fieldset className="intake__field"><legend className="intake__label">{t('intake.flowDirection.label')}</legend>{(['forward','backward'] as const).map((direction) => <label key={direction} className="intake__radio-label"><input id="field-flowDirection" type="radio" name="flow" checked={values.flowDirection === direction} onChange={() => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { flowDirection: direction } })}/>{t(`intake.flowDirection.${direction}`)}</label>)}</fieldset>}
        <label className="intake__radio-label"><input type="checkbox" checked={values.includeDecadalLimits} onChange={(event) => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { includeDecadalLimits: event.target.checked } })}/>{t('intake.includeDecades')}</label>
        <label className="intake__radio-label"><input type="checkbox" checked={values.interpret} onChange={(event) => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { interpret: event.target.checked } })}/>{t('intake.includeInterpret')}</label>
      </div>}

      {state.intakeStep === 3 && <div role="tabpanel"><h2 className="intake__step-title">{t(STEP_KEYS[3])}</h2>
        <fieldset className="intake__field"><legend className="intake__label">{t('intake.language.label')}</legend>{([['de','de-DE'],['en','en-US']] as const).map(([language, locale]) => <label key={language} className="intake__radio-label"><input type="radio" name="locale" checked={values.locale === locale} onChange={() => { dispatch({ type: 'SET_LANGUAGE', payload: language }); dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { locale } }); }}/>{t(`intake.language.${language}`)}</label>)}</fieldset>
        <p>{t('intake.scriptVariant.hant')} · TW_TRADITIONAL</p>
        <details className="intake__privacy"><summary>{t('intake.privacyTitle')}</summary><p>{t('intake.privacyBody')}</p></details>
        <label className="intake__radio-label"><input id="field-privacyConsent" type="checkbox" checked={values.privacyConsent} onChange={(event) => dispatch({ type: 'UPDATE_INTAKE_VALUES', payload: { privacyConsent: event.target.checked } })}/>{t('intake.privacyConsent')}</label>
      </div>}

      {state.intakeStep === 4 && <div role="tabpanel"><h2 className="intake__step-title">{t('intake.review.title')}</h2><div className="intake__review-section"><p>{values.date} · {values.time} · {values.location?.displayName} · {values.location?.timezone}</p><p>{t(`intake.directionMethod.${values.directionMethod}`)} · {values.locale} · zh-Hant</p></div>{isFixtureMode() && deviatesFromDemo(values) && <p className="intake__demo-warning">{t('intake.demoNotRecalculated')}</p>}{isFixtureMode() && <p className="intake__mock-notice">{t('intake.calculate.mockNotice')}</p>}</div>}

      <div className="intake__actions"><button className="btn btn--ghost" onClick={() => state.intakeStep ? dispatch({ type: 'SET_INTAKE_STEP', payload: state.intakeStep - 1 }) : dispatch({ type: 'SET_VIEW', payload: 'landing' })}>{t('intake.back')}</button>{state.intakeStep < 4 ? <button className="btn btn--primary" onClick={next}>{t('intake.next')}</button> : <button className="btn btn--primary" onClick={calculate}>{t('intake.calculate')}</button>}</div>
    </div>
    <span className="visually-hidden">{DEMO_PROFILE.date}</span>
  </div></section>;
}

function Field({ label, id, error, children }: { label: string; id: string; error: string | null; children: React.ReactNode }) {
  return <div className="intake__field"><label className="intake__label" htmlFor={id}>{label}</label>{children}{error && <p className="intake__error" role="alert">{error}</p>}</div>;
}