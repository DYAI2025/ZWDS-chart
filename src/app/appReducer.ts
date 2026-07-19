import type { NormalizedZwdsReport, PalaceId, ReportSection } from '@/domain/zwdsTypes';
import type { IntakeFormValues } from '@/domain/intakeTypes';
import { INITIAL_INTAKE_VALUES } from '@/domain/intakeTypes';
import { FEATURE_FLAGS } from './featureFlags';

// ── State ─────────────────────────────────────────────────
export type AppView = 'landing' | 'intake' | 'loading' | 'report' | 'error';
// 'guided' is the Western-adaptation plain-language entry view (Iteration 1); the four
// traditional sub-views remain reachable so nothing is hidden.
export type ReportSubView = 'guided' | 'atlas' | 'reading' | 'evidence' | 'method';
export type Language = 'de' | 'en';

export interface AppState {
  view: AppView;
  language: Language;
  intakeStep: number;
  intakeValues: IntakeFormValues;
  providerLoading: boolean;
  providerError: string | null;
  providerErrorCode: string | null;
  report: NormalizedZwdsReport | null;
  reportToken: string | null;
  sections: ReportSection[];
  selectedPalaceId: PalaceId | null;
  selectedDecadeIndex: number | null;
  evidenceDrawerOpen: boolean;
  mobileMapDialogOpen: boolean;
  reportSubView: ReportSubView;
  calculationStatus: 'IDLE' | 'DEMO_FIXTURE' | 'LIVE' | 'ERROR';
}

export const INITIAL_APP_STATE: AppState = {
  view: 'landing',
  language: 'en',
  intakeStep: 0,
  intakeValues: { ...INITIAL_INTAKE_VALUES },
  providerLoading: false,
  providerError: null,
  providerErrorCode: null,
  report: null,
  reportToken: null,
  sections: [],
  selectedPalaceId: null,
  selectedDecadeIndex: null,
  evidenceDrawerOpen: false,
  mobileMapDialogOpen: false,
  reportSubView: 'atlas',
  calculationStatus: 'IDLE',
};

// ── Actions ───────────────────────────────────────────────
export type AppAction =
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_INTAKE_STEP'; payload: number }
  | { type: 'UPDATE_INTAKE_VALUES'; payload: Partial<IntakeFormValues> }
  | { type: 'START_CALCULATION' }
  | { type: 'CALCULATION_SUCCESS'; payload: { report: NormalizedZwdsReport; sections: ReportSection[]; reportToken: string | null } }
  | { type: 'CALCULATION_ERROR'; payload: { message: string; code: string } }
  | { type: 'SELECT_PALACE'; payload: PalaceId | null }
  | { type: 'SELECT_DECADE'; payload: number | null }
  | { type: 'TOGGLE_EVIDENCE_DRAWER'; payload?: boolean }
  | { type: 'SET_MOBILE_MAP_DIALOG'; payload: boolean }
  | { type: 'SET_REPORT_SUB_VIEW'; payload: ReportSubView }
  | { type: 'RESET_TO_INTAKE' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
        intakeValues: {
          ...state.intakeValues,
          locale: action.payload === 'de' ? 'de-DE' : 'en-US',
        },
      };

    case 'SET_INTAKE_STEP':
      return { ...state, intakeStep: action.payload };

    case 'UPDATE_INTAKE_VALUES':
      return { ...state, intakeValues: { ...state.intakeValues, ...action.payload } };

    case 'START_CALCULATION':
      return { ...state, providerLoading: true, providerError: null, providerErrorCode: null, view: 'loading' };

    case 'CALCULATION_SUCCESS': {
      const { report, sections, reportToken } = action.payload;
      const mingPalace = report.palaces.find((p) => p.isMing) ?? report.palaces[0];
      return {
        ...state,
        providerLoading: false,
        report,
        reportToken,
        sections,
        view: 'report',
        selectedPalaceId: mingPalace.palaceId,
        selectedDecadeIndex: 1,
        // Guided-first entry when enabled (docs/plans/2026-07-19…): the plain-language
        // summary is shown before the traditional atlas. Reversible via the flag.
        reportSubView: FEATURE_FLAGS.guidedDefault && FEATURE_FLAGS.guidedSummary ? 'guided' : 'atlas',
        calculationStatus: report.calculation.dataMode === 'fixture' ? 'DEMO_FIXTURE' : 'LIVE',
        evidenceDrawerOpen: false,
      };
    }

    case 'CALCULATION_ERROR':
      return {
        ...state,
        providerLoading: false,
        providerError: action.payload.message,
        providerErrorCode: action.payload.code,
        calculationStatus: 'ERROR',
        view: 'error',
      };

    case 'SELECT_PALACE':
      return { ...state, selectedPalaceId: action.payload };

    case 'SELECT_DECADE':
      return { ...state, selectedDecadeIndex: action.payload };

    case 'TOGGLE_EVIDENCE_DRAWER':
      return { ...state, evidenceDrawerOpen: action.payload ?? !state.evidenceDrawerOpen };

    case 'SET_MOBILE_MAP_DIALOG':
      return { ...state, mobileMapDialogOpen: action.payload };

    case 'SET_REPORT_SUB_VIEW':
      return { ...state, reportSubView: action.payload };

    case 'RESET_TO_INTAKE':
      return {
        ...state,
        view: 'intake',
        intakeStep: 0,
        report: null,
        reportToken: null,
        sections: [],
        selectedPalaceId: null,
        selectedDecadeIndex: null,
        providerError: null,
        providerErrorCode: null,
        calculationStatus: 'IDLE',
      };

    default:
      return state;
  }
}
