import type { ZwdsBirthInput } from './zwdsTypes';

// ── Intake form values (mirrors ZwdsBirthInput, nullable) ──
export interface IntakeFormValues {
  date: string;
  time: string;
  placeQuery: string;
  location: ZwdsBirthInput['location'];
  sexAtBirth: 'male' | 'female' | '';
  directionMethod: ZwdsBirthInput['directionMethod'];
  flowDirection: 'forward' | 'backward' | '';
  locale: 'de-DE' | 'en-US';
  scriptVariant: 'zh-Hant' | 'zh-Hans';
  includeDecadalLimits: boolean;
  interpret: boolean;
  privacyConsent: boolean;
  demoModified: boolean; // user edited birth fields away from the demo profile
}

export const INITIAL_INTAKE_VALUES: IntakeFormValues = {
  date: '',
  time: '',
  placeQuery: '',
  location: null,
  sexAtBirth: '',
  directionMethod: 'year_stem_yinyang_and_sex',
  flowDirection: '',
  locale: 'en-US',
  scriptVariant: 'zh-Hant',
  includeDecadalLimits: true,
  interpret: true,
  privacyConsent: false,
  demoModified: false,
};

// ── Fixed demo profile (bound to the golden fixture) ──────
export const DEMO_PROFILE = {
  date: '1984-02-01',
  time: '23:30',
  placeQuery: 'Shanghai',
  location: {
    lat: 31.2304,
    lon: 121.4737,
    timezone: 'Asia/Shanghai',
    displayName: 'Shanghai, China',
    confirmed: true,
  } as const,
  sexAtBirth: 'male' as const,
};

export function demoPrefill(): IntakeFormValues {
  return {
    ...INITIAL_INTAKE_VALUES,
    date: DEMO_PROFILE.date,
    time: DEMO_PROFILE.time,
    placeQuery: DEMO_PROFILE.placeQuery,
    location: { ...DEMO_PROFILE.location },
    sexAtBirth: DEMO_PROFILE.sexAtBirth,
    demoModified: false,
  };
}

/** True if the user deviated from the fixture-bound demo profile. */
export function deviatesFromDemo(v: IntakeFormValues): boolean {
  if (v.date !== DEMO_PROFILE.date) return true;
  if (v.time !== DEMO_PROFILE.time) return true;
  if (!v.location) return true;
  if (v.location.timezone !== DEMO_PROFILE.location.timezone) return true;
  if (Math.abs(v.location.lat - DEMO_PROFILE.location.lat) > 0.01) return true;
  if (Math.abs(v.location.lon - DEMO_PROFILE.location.lon) > 0.01) return true;
  if (v.sexAtBirth && v.sexAtBirth !== DEMO_PROFILE.sexAtBirth) return true;
  return false;
}

// ── Validation ─────────────────────────────────────────────
export interface ValidationError {
  field: string;
  messageKey: string;
}

export function validateIntakeStep(step: number, values: IntakeFormValues): ValidationError[] {
  const errors: ValidationError[] = [];
  const req = (field: string) => errors.push({ field, messageKey: 'validation.required' });

  switch (step) {
    case 0: // date, time, sex
      if (!values.date) req('date');
      if (!values.time) req('time');
      if (values.directionMethod === 'year_stem_yinyang_and_sex' && !values.sexAtBirth) req('sexAtBirth');
      break;
    case 1: // confirmed location with timezone — non-negotiable
      if (!values.location) req('location');
      else if (!values.location.timezone) req('location');
      break;
    case 2: // direction method
      if (!values.directionMethod) req('directionMethod');
      if (values.directionMethod === 'explicit' && !values.flowDirection) req('flowDirection');
      break;
    case 3: // display + privacy
      if (!values.locale) req('locale');
      if (!values.scriptVariant) req('scriptVariant');
      if (!values.privacyConsent) req('privacyConsent');
      break;
    case 4:
      break;
  }
  return errors;
}

/** Map intake values to the browser DTO. */
export function toBirthInput(v: IntakeFormValues): ZwdsBirthInput | null {
  if (!v.location || !v.sexAtBirth) return null;
  return {
    date: v.date,
    time: v.time,
    placeQuery: v.placeQuery,
    location: v.location,
    sexAtBirth: v.sexAtBirth,
    directionMethod: v.directionMethod,
    flowDirection: v.directionMethod === 'explicit' ? (v.flowDirection as 'forward' | 'backward') : undefined,
    locale: v.locale,
    scriptVariant: v.scriptVariant,
    includeDecadalLimits: v.includeDecadalLimits,
    interpret: v.interpret,
    privacyConsent: v.privacyConsent,
  };
}
