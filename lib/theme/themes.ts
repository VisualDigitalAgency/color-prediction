/**
 * AuraWin — visual theme system.
 *
 * Each theme is a flat map of CSS custom properties applied to the app root
 * (`document.documentElement`) by ThemeProvider, plus a `screen` background and
 * a font stack. Brand colors (green / red / violet) stay semantically stable
 * across themes so game logic never has to care which theme is active.
 *
 * Values are ported VERBATIM from the prototype (`app/themes.js`). Only CSS
 * variable VALUES change between themes — layout never branches per theme.
 */

import type { ThemeId } from '../../types';

/** Flat map of CSS custom property name → value. */
export type ThemeVars = Record<string, string>;

export interface Theme {
  id: ThemeId;
  label: string;
  /** Font stack assigned to `--app-font` for this theme. */
  font: string;
  /** Device-viewport background gradient (assigned to `--screen`). */
  screen: string;
  vars: ThemeVars;
}

export const THEMES: Record<ThemeId, Theme> = {
  /* ─────────────── 1 · NEON CASINO ─────────────── */
  neon: {
    id: 'neon',
    label: 'Neon Casino',
    font: "'Poppins', system-ui, sans-serif",
    screen:
      'radial-gradient(120% 80% at 50% -10%, #16123a 0%, #0a0a17 42%, #06060d 100%)',
    vars: {
      '--bg': '#06060d',
      '--surface': '#13141f',
      '--surface-2': '#1b1d2b',
      '--surface-3': '#23263a',
      '--glass': 'rgba(255,255,255,0.05)',
      '--glass-brd': 'rgba(255,255,255,0.09)',
      '--border': 'rgba(255,255,255,0.08)',
      '--text': '#f5f7ff',
      '--text-dim': '#9ea4be',
      '--text-mute': '#5d6280',
      '--green': '#15e08a',
      '--green-2': '#0bbf72',
      '--red': '#ff3460',
      '--red-2': '#e51e4d',
      '--violet': '#b14bff',
      '--gold': '#ffc63d',
      '--accent': '#15e08a',
      '--accent-2': '#ffc63d',
      '--accent-ink': '#04130c',
      '--radius': '20px',
      '--radius-sm': '13px',
      '--chip': '#23263a',
      '--glow-green': '0 0 22px rgba(21,224,138,.55)',
      '--glow-red': '0 0 22px rgba(255,52,96,.55)',
      '--glow-violet': '0 0 22px rgba(177,75,255,.55)',
      '--glow-accent': '0 0 28px rgba(21,224,138,.5)',
      '--card-shadow': '0 18px 40px -18px rgba(0,0,0,.8)',
      '--header-grad': 'linear-gradient(135deg, #1ce08a 0%, #0bb568 100%)',
    },
  },

  /* ─────────────── 2 · PREMIUM FINTECH ─────────────── */
  fintech: {
    id: 'fintech',
    label: 'Premium Fintech',
    font: "'Manrope', system-ui, sans-serif",
    screen: 'linear-gradient(180deg, #0e1117 0%, #0a0c11 100%)',
    vars: {
      '--bg': '#0a0c11',
      '--surface': '#141821',
      '--surface-2': '#1b2029',
      '--surface-3': '#242a35',
      '--glass': 'rgba(255,255,255,0.035)',
      '--glass-brd': 'rgba(255,255,255,0.06)',
      '--border': 'rgba(255,255,255,0.06)',
      '--text': '#eef1f7',
      '--text-dim': '#9aa2b2',
      '--text-mute': '#5b6373',
      '--green': '#2fce97',
      '--green-2': '#22b582',
      '--red': '#ef6a72',
      '--red-2': '#dd4d56',
      '--violet': '#8e7cf2',
      '--gold': '#e3b964',
      '--accent': '#e3b964',
      '--accent-2': '#2fce97',
      '--accent-ink': '#1a1405',
      '--radius': '16px',
      '--radius-sm': '11px',
      '--chip': '#232934',
      '--glow-green': '0 0 14px rgba(47,206,151,.28)',
      '--glow-red': '0 0 14px rgba(239,106,114,.28)',
      '--glow-violet': '0 0 14px rgba(142,124,242,.28)',
      '--glow-accent': '0 0 18px rgba(227,185,100,.3)',
      '--card-shadow': '0 16px 36px -20px rgba(0,0,0,.85)',
      '--header-grad': 'linear-gradient(135deg, #e8c272 0%, #c79742 100%)',
    },
  },

  /* ─────────────── 3 · FUTURISTIC CYBER ─────────────── */
  cyber: {
    id: 'cyber',
    label: 'Futuristic Cyber',
    font: "'Space Grotesk', 'Poppins', system-ui, sans-serif",
    screen:
      'radial-gradient(110% 75% at 80% -5%, #1a1150 0%, #0a0a24 45%, #04030f 100%)',
    vars: {
      '--bg': '#04030f',
      '--surface': 'rgba(22,20,54,0.66)',
      '--surface-2': 'rgba(38,33,82,0.66)',
      '--surface-3': 'rgba(54,48,108,0.6)',
      '--glass': 'rgba(124,92,255,0.08)',
      '--glass-brd': 'rgba(124,200,255,0.16)',
      '--border': 'rgba(124,180,255,0.14)',
      '--text': '#ecf1ff',
      '--text-dim': '#9fa9d8',
      '--text-mute': '#646a9e',
      '--green': '#1fffb0',
      '--green-2': '#10e09a',
      '--red': '#ff4d7d',
      '--violet': '#8b5cff',
      '--red-2': '#f0356b',
      '--cyan': '#1fe0ff',
      '--gold': '#ffd24a',
      '--accent': '#8b5cff',
      '--accent-2': '#1fe0ff',
      '--accent-ink': '#0a061f',
      '--radius': '18px',
      '--radius-sm': '12px',
      '--chip': 'rgba(54,48,108,0.7)',
      '--glow-green': '0 0 22px rgba(31,255,176,.5)',
      '--glow-red': '0 0 22px rgba(255,77,125,.5)',
      '--glow-violet': '0 0 22px rgba(139,92,255,.6)',
      '--glow-accent': '0 0 30px rgba(139,92,255,.6)',
      '--card-shadow': '0 18px 44px -18px rgba(0,0,0,.85)',
      '--header-grad': 'linear-gradient(135deg, #8b5cff 0%, #1fe0ff 120%)',
    },
  },
};

export const DEFAULT_THEME: ThemeId = 'neon';
