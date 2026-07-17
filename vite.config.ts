import { readFileSync } from 'node:fs';

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const host = process.env.TAURI_DEV_HOST;
const isTauriDesktopBuild = Boolean(process.env.TAURI_ENV_PLATFORM);

function extractStyleBlock(source: string): string {
  const matches = [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)];
  return matches.length > 0 ? matches[matches.length - 1][1] : '';
}

function sanitizeBrokenSvelteVirtualCss(): Plugin {
  return {
    name: 'bismuth-sanitize-svelte-virtual-css',
    apply: 'serve',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('?svelte&type=style&lang.css')) return null;
      if (!code.trimStart().startsWith('<')) return null;

      const sourcePath = id.split('?', 1)[0];
      const source = readFileSync(sourcePath, 'utf-8');
      const css = extractStyleBlock(source);
      return { code: css, map: null };
    },
  };
}

export default defineConfig({
  plugins: [sanitizeBrokenSvelteVirtualCss(), sveltekit()],

  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
          clientPort: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**', '**/build/**', '**/coverage/**', '**/.svelte-kit/output/**'],
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },

  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  optimizeDeps: {
    exclude: ['@codemirror/state', '@codemirror/view'],
  },

  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    cssCodeSplit: !isTauriDesktopBuild,
  },
});
