// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_ENV?: string;
    readonly VITE_FEATURE_FLAGS?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  namespace App {
    interface Error {
      message: string;
      code?: string;
      details?: string;
      source?: string;
      status?: number;
      timestamp?: string;
    }

    // No server hooks — Tauri desktop app with ssr: false
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- SvelteKit requires this interface
    interface Locals {}

    interface PageData {
      title?: string;
      description?: string;
      routeId?: string;
      tab?: string;
      view?: string;
      focus?: string;
      note?: string;
    }

    interface PageState {
      notePath?: string;
      scrollY?: number;
      showSettings?: boolean;
      settingsTab?: string;
      showPalette?: boolean;
    }

    // adapter-static — no platform-specific context
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- SvelteKit requires this interface
    interface Platform {}
  }

  const __APP_VERSION__: string;
  const __APP_BUILD_DATE__: string;
}

declare module '*.css' {
  const css: string;
  export default css;
}

export {};
