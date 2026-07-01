import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

const isDev = process.env.TAURI_ENV_DEBUG === "true" || process.env.NODE_ENV === "development";

export default defineConfig(async (_env) => ({
  plugins: [
    svelte({
      compilerOptions: {
        dev: isDev,
      },
    }),
  ],

  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      '@': path.resolve("./src/lib"),
    },
  },

  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5183,
      clientPort: 5183,
    },
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  optimizeDeps: {
    include: [
      'svelte',
      'svelte/store',
      'svelte/transition',
      'svelte/animate',
      'date-fns',
      'colord',
      'dompurify',
      'fast-json-patch',
      'focus-trap',
    ],
    exclude: ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-fs'],
  },

  // Configure workers to use rolldown (Vite 8 default) instead of deprecated esbuild transform
  worker: {
    format: 'es',
  },

  build: {
    minify: isDev ? false : 'oxc',
    sourcemap: isDev,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      // Optional dependencies not installed by default; externalize so rolldown doesn't error
      external: [
        'hyperformula', 'standardized-audio-context', 'pdfjs-dist',
        'abcjs', 'smiles-drawer', '@replit/codemirror-vim',
        '@codemirror/lang-json', '@codemirror/lang-javascript', '@codemirror/lang-html',
        '@codemirror/lang-css', '@codemirror/lang-python', '@codemirror/lang-rust',
        '@codemirror/lang-cpp', '@codemirror/lang-java', '@codemirror/lang-php',
        '@codemirror/lang-xml', '@codemirror/lang-sql', '@codemirror/lang-yaml',
        '@codemirror/lang-go',
      ],
      output: {
        // Short stable names aid debugging and Tauri's asset cache
        chunkFileNames: '[name]-[hash:8].js',
        entryFileNames: '[name]-[hash:8].js',
        // Function form required by rolldown (Vite 8)
        manualChunks(id: string) {
          if (id.includes('@codemirror/')) return 'codemirror';
          if (id.includes('konva')) return 'vendor-canvas';
          if (id.includes('unified') || id.includes('remark') || id.includes('rehype') || id.includes('marked')) return 'vendor-markdown';
          if (id.includes('date-fns')) return 'vendor-dates';
          if (id.includes('chart.js')) return 'vendor-charts';
          if (id.includes('tone')) return 'vendor-audio';
          if (id.includes('dompurify')) return 'vendor-sanitize';
          if (id.includes('svelte')) return 'svelte-runtime';
        },
      },
    },
  },
}));
