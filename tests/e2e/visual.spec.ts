/**
 * tests/e2e/visual.spec.ts — Playwright visual regression tests.
 *
 * Each test:
 *  1. Seeds localStorage with an authed + age-confirmed state.
 *  2. Navigates to the route at 1280×900 (≥1100 desktop branch).
 *  3. Waits for hydration.
 *  4. Takes a full-page screenshot and compares to the stored golden.
 *
 * First run (no goldens): `npm run test:e2e:update` to create snapshots.
 * CI: run `npm run test:e2e` — any diff > threshold fails the build.
 */
import { test, expect } from '@playwright/test';
import { injectAuthState, waitForHydration } from './helpers';

const THEMES = ['neon', 'fintech', 'cyber'] as const;

/**
 * Routes that require authentication. The landing page (`/`) is tested
 * separately since it should redirect authed users to /lobby.
 */
const AUTHED_ROUTES = [
  { name: 'lobby', path: '/lobby' },
  { name: 'game', path: '/game' },
  { name: 'wallet', path: '/wallet' },
  { name: 'deposit', path: '/deposit' },
  { name: 'withdraw', path: '/withdraw' },
  { name: 'history', path: '/history' },
  { name: 'rewards', path: '/rewards' },
  { name: 'referral', path: '/referral' },
  { name: 'vip', path: '/vip' },
  { name: 'profile', path: '/profile' },
  { name: 'settings', path: '/settings' },
] as const;

// ── Landing page (unauthenticated) ───────────────────────────────────────────

test('landing page — unauthenticated', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1, [class*="hero"]', { timeout: 10_000 });
  await page.waitForTimeout(300);
  await expect(page).toHaveScreenshot('landing--unauth.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});

// ── All authed routes × all 3 themes ─────────────────────────────────────────

for (const theme of THEMES) {
  test.describe(`theme: ${theme}`, () => {
    for (const route of AUTHED_ROUTES) {
      test(`${route.name} — ${theme}`, async ({ page }) => {
        await injectAuthState(page, theme);
        await page.goto(route.path);
        await waitForHydration(page);

        await expect(page).toHaveScreenshot(`${route.name}--${theme}.png`, {
          maxDiffPixelRatio: 0.02,
          animations: 'disabled',
        });
      });
    }
  });
}

// ── Age-gate overlay ──────────────────────────────────────────────────────────

test('age gate is shown for un-confirmed users', async ({ page }) => {
  // Seed authed but ageConfirmed=false → age gate should appear
  await page.addInitScript(() => {
    const state = {
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
        missions: [],
      },
      settings: {
        theme: 'neon',
        colorBlind: false,
        reducedMotion: false,
        ageConfirmed: false,
      },
    };
    window.localStorage.setItem('aurawin:v1:state', JSON.stringify(state));
  });

  await page.goto('/lobby');
  await page.waitForTimeout(600);

  await expect(page).toHaveScreenshot('age-gate--visible.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});

// ── Disclaimer is present on the landing page ─────────────────────────────────

test('landing page contains simulated disclaimer', async ({ page }) => {
  await page.goto('/');
  const page_text = await page.textContent('body');
  expect(page_text?.toLowerCase()).toMatch(/simulated|no real money/i);
});
