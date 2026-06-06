/**
 * AuraWin — theme system barrel.
 *
 * Public surface for the theme module: the provider/hook, the theme registry,
 * the default theme id, and the supporting types.
 */

export { ThemeProvider, useTheme, THEME_STORAGE_KEY } from './ThemeProvider';
export { THEMES, DEFAULT_THEME } from './themes';
export type { Theme, ThemeVars } from './themes';
