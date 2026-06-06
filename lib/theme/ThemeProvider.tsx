'use client';

/**
 * AuraWin — ThemeProvider.
 *
 * Applies the active theme to `document.documentElement` synchronously before
 * paint (`useLayoutEffect`): sets `data-theme`, every CSS variable from the
 * theme's `vars` map, plus `--screen` and `--app-font`. Persists the choice to
 * localStorage (`aurawin:v1:settings:theme`).
 *
 * The no-flash script in `app/layout.tsx` sets `data-theme` from localStorage
 * before first paint; this provider then layers the full variable set on top.
 *
 * Only CSS variable VALUES change between themes — components never branch on
 * the active theme, they read `var(--…)`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeId } from '../../types';
import { THEMES, DEFAULT_THEME, type Theme } from './themes';

/** localStorage key for the persisted theme id (versioned, per spec). */
export const THEME_STORAGE_KEY = 'aurawin:v1:settings:theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  /** The full active theme object (label, font, vars, …). */
  current: Theme;
  /** All available themes, for pickers. */
  themes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Coerce any value to a valid ThemeId, falling back to the default. */
function normalizeThemeId(value: unknown): ThemeId {
  return typeof value === 'string' && value in THEMES
    ? (value as ThemeId)
    : DEFAULT_THEME;
}

/** Read the persisted theme id (SSR-safe). */
function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return normalizeThemeId(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply a theme's `data-theme`, CSS vars, screen bg and font to <html>. */
function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  const theme = THEMES[id] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.id);
  for (const [name, value] of Object.entries(theme.vars)) {
    root.style.setProperty(name, value);
  }
  root.style.setProperty('--screen', theme.screen);
  root.style.setProperty('--app-font', theme.font);
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  /** Optional override; otherwise read from localStorage / default. */
  initialTheme?: ThemeId;
}) {
  const [theme, setThemeState] = useState<ThemeId>(
    () => initialTheme ?? readStoredTheme(),
  );

  // Synchronous, pre-paint DOM mutation so vars/font/screen are in place
  // before the browser paints (the no-flash script only set data-theme).
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    const next = normalizeThemeId(id);
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode / quota) — non-fatal */
    }
  }, []);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    current: THEMES[theme] ?? THEMES[DEFAULT_THEME],
    themes: THEMES,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Access the active theme and `setTheme`. Must be used within ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
