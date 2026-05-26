import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [svelte()],

  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      '@': path.resolve("./src/lib"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5183,
    },
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  // Enable fast refresh for Svelte
  optimizeDeps: {
    include: ['svelte'],
  },
  build: {
    // Faster builds in dev
    minify: false,
    sourcemap: true,
  },
}));
