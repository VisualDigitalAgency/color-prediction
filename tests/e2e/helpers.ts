import type { Page } from '@playwright/test';

/**
 * Storage key for AuraWin persisted state — must match
 * lib/persistence/LocalStorageRepository.ts STORAGE_KEYS.state.
 */
const STATE_KEY = 'aurawin:v1:state';

/**
 * Minimal authed + ageConfirmed state that passes all client-side guards.
 * Monetary values are integer minor-units (toMinor(display)).
 */
const authedState = {
  version: 1,
  auth: { authed: true, uid: 'demo-playwright' },
  wallet: { main: 128450, bonus: 3600, winning: 41275, referral: 8820 },
  bets: [],
  tx: [],
  vip: { tier: 1, xp: 450 },
  rewards: {
    freeSpins: 3,
    spinPrizes: [],
    checkInClaimed: [],
    checkInRewards: [200, 500, 1000, 1500, 2000, 3000, 8800],
    missions: [
      { id: 'm-deposit', label: 'Make a deposit', reward: 5000, progress: 1, goal: 1, done: false },
      { id: 'm-bets', label: 'Place 5 bets', reward: 2000, progress: 0, goal: 5, done: false },
      { id: 'm-spin', label: 'Try the lucky spin', reward: 1000, progress: 0, goal: 1, done: false },
    ],
  },
  settings: {
    theme: 'neon',
    colorBlind: false,
    reducedMotion: false,
    ageConfirmed: true,
  },
};

/**
 * Injects a full authed + ageConfirmed localStorage state before the page loads.
 * Call this in `page.addInitScript()` before navigating.
 */
export async function injectAuthState(page: Page, theme = 'neon'): Promise<void> {
  const state = { ...authedState, settings: { ...authedState.settings, theme } };
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string);
    },
    [STATE_KEY, JSON.stringify(state)],
  );
}

/** Wait for the app shell to hydrate (sidebar nav is the first rendered element post-hydration). */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="sidebar"], nav, main', { timeout: 15_000 });
  // Brief settle for animations / async data
  await page.waitForTimeout(400);
}
