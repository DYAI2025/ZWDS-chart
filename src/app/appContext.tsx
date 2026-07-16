import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, INITIAL_APP_STATE, type AppState, type AppAction } from './appReducer';
import { en } from '@/data/localization/en';
import { de } from '@/data/localization/de';
import type { Language } from './appReducer';

// ── Localization ──────────────────────────────────────────
const LOCALES: Record<Language, Record<string, string>> = { en, de };

export function t(key: string, language: Language): string {
  return LOCALES[language]?.[key] ?? key;
}

// ── Context ───────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, INITIAL_APP_STATE);
  const localize = (key: string) => t(key, state.language);

  return (
    <AppContext.Provider value={{ state, dispatch, t: localize }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
