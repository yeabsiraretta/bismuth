import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // ── Entry points ────────────────────────────────────────────────
  entry: [
    // SvelteKit routes (pages, layouts, errors, server)
    'src/routes/**/+{page,layout,error,server}.{ts,svelte}',
    // SvelteKit param matchers
    'src/params/*.ts',
    // SvelteKit hooks
    'src/hooks.{client,server}.ts',
    // Vitest tests
    'src/**/*.test.ts',
    // Vitest setup file (loaded by runner, not imported from tests directly)
    'src/test/setup-tauri.ts',
  ],

  // ── Project files (what knip considers "in scope") ──────────────
  project: ['src/**/*.{ts,svelte}'],

  // ── Paths aliases ───────────────────────────────────────────────
  paths: {
    '@/*': ['src/lib/*'],
    '$app/*': ['.svelte-kit/runtime/app/*'],
  },

  // ── Ignore patterns ─────────────────────────────────────────────
  ignore: [
    // Test mocks (referenced by vitest.config.ts aliases, not direct imports)
    'src/test/mocks/**',
  ],
};

export default config;
