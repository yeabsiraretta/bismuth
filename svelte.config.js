import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import * as child_process from 'node:child_process';

function getGitHash() {
  try {
    return child_process.execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return Date.now().toString();
  }
}

const dev = process.env.NODE_ENV !== 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
    }),
    alias: {
      '@': 'src/lib',
    },
    // CSP only in production; dev mode CSP breaks Vite HMR
    ...(dev
      ? {}
      : {
          csp: {
            mode: 'auto',
            directives: {
              'default-src': ['self'],
              'script-src': ['self'],
              'style-src': ['self', 'unsafe-inline'],
              'img-src': ['self', 'data:', 'blob:'],
              'font-src': ['self', 'data:'],
              'connect-src': ['self', 'https://ipc.localhost', 'tauri://localhost'],
              'object-src': ['none'],
              'base-uri': ['self'],
            },
          },
        }),
    experimental: {
      handleRenderingErrors: true,
    },
    inlineStyleThreshold: 5120,
    output: {
      preloadStrategy: 'modulepreload',
    },
    serviceWorker: {
      register: false,
    },
    prerender: {
      entries: [],
    },
    version: {
      name: getGitHash(),
    },
  },
};

export default config;
