import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for visual regression tests.
 *
 * Runs against the production build (`npm run build && npm start`).
 * First run: `npm run test:e2e:update` to capture golden snapshots.
 * Subsequent runs: `npm run test:e2e` compares against goldens.
 *
 * Snapshot location: tests/e2e/__snapshots__/ (committed alongside tests).
 */
export default defineConfig({
  testDir: './tests/e2e',
  snapshotDir: './tests/e2e/__snapshots__',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 900 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
