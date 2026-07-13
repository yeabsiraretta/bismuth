import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': '/src/lib',
      '$app/navigation': '/src/test/mocks/app-navigation.ts',
      '$app/paths': '/src/test/mocks/app-paths.ts',
      '$app/state': '/src/test/mocks/app-state.ts',
      $params: '/src/params',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup-tauri.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/test/**'],
    },
  },
});
