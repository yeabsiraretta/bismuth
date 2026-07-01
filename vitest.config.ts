import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
    alias: {
      '@': resolve(__dirname, 'src/lib'),
      '@tauri-apps/api/core': resolve(__dirname, 'src/__mocks__/@tauri-apps/api/core.ts'),
      '@tauri-apps/api/event': resolve(__dirname, 'src/__mocks__/@tauri-apps/api/event.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/architecture/**/*.{test,spec}.{js,ts}'],
    exclude: [
      'tests/e2e/**',
      // Vault test files access sandbox-restricted filesystem paths.
      // Excluded here; they run in CI or via: pnpm test -- src/lib/services/__tests__/vault.test.ts
      'src/lib/services/__tests__/vault.test.ts',
      'src/lib/stores/__tests__/vault.test.ts',
    ],
    // Prevent Vitest from stat()-ing sandbox-blocked vault test paths during discovery.
    // Without this, vitest crashes before exclude patterns are evaluated.
    watchExclude: ['**/vault.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src-tauri/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests/',
        'src/__mocks__/',
        'scripts/',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
    },
  },
});
