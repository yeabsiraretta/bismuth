import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  // Vite plugin options
  vitePlugin: {
    // Enable HMR (Hot Module Replacement)
    hot: {
      preserveLocalState: true,
      noReload: false,
    },
  },

  // Compiler options for faster dev builds
  compilerOptions: {
    dev: true,
    enableSourcemap: true,
    compatibility: {
      componentApi: 4,
    },
  },
}
