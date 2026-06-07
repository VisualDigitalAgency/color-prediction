import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest config — maps the `@/` path alias (mirrors tsconfig `paths`) so test files
 * can import source modules the same way the app does. Default `node` environment;
 * persistence tests mock `window`/`localStorage` explicitly rather than relying on
 * jsdom, which keeps the test deps minimal and lets us cover the SSR (no-window) path.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    server: {
      deps: {
        // html-encoding-sniffer (pulled in by jsdom) uses require() on an ESM
        // package (@exodus/bytes). Inlining it lets Vite transform it to ESM.
        inline: ['html-encoding-sniffer', '@exodus/bytes'],
      },
    },
  },
});
