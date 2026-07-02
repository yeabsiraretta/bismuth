# Asset Caching in Bismuth

## Development Mode

In development, Vite runs a dev server at `localhost:5173`. Hot Module Replacement (HMR) is
handled via a WebSocket on port 5183. When source files change, Vite pushes updates directly
to the connected WebView without a full page reload.

Dynamic `import()` calls in development resolve to Vite's module graph, which handles
deduplication and caching within the dev session. There is no persistent cache between
restarts.

## Production Mode

In production, `pnpm tauri build` compiles the frontend and places all assets under
`dist/assets/`. Tauri serves these files via the `tauri://` custom protocol, which maps
directly to the bundled `dist/` directory inside the app bundle. No HTTP server is involved.

### WebView Module Cache

The JavaScript module cache is managed by the WebView engine:

- **macOS**: WKWebView (WebKit) maintains a module cache keyed by URL. Files served from
  `tauri://localhost/assets/chunk-[hash].js` are cached by the WebView across app restarts
  as long as the URL is unchanged.
- **Windows**: WebView2 (Chromium-based) applies similar disk-backed HTTP cache semantics
  to the `tauri://` protocol.

Because Vite uses content-addressed filenames (`[name]-[hash:8].js`), a chunk filename
only changes when its content changes. This means unchanged chunks are served from the
WebView cache on subsequent app launches, reducing startup I/O.

On a full app update (new installer), all files in `dist/` are replaced. The new filenames
(different hashes) cause cache misses, ensuring updated code is loaded.

### Explicit Module Registry

`src/lib/utils/storage/featurePreload.ts` maintains a `PRELOADABLE` map keyed by feature ID.
This serves as an explicit registry of all lazily-loadable features. The `Map<featureId,
() => Promise<unknown>>` pattern ensures:

1. Only known feature IDs can trigger a dynamic import (no arbitrary path injection).
2. The browser's native `import()` deduplication means a feature module is downloaded at
   most once per session, even if `preloadPreviouslyUsedFeatures` and the user's explicit
   navigation both trigger imports for the same feature.
3. Staggered preloads (100 ms between each) prevent startup I/O saturation.

## Summary

| Context       | Asset Server                             | Cache                                  |
| ------------- | ---------------------------------------- | -------------------------------------- |
| Development   | Vite (`localhost:5173`)                  | In-memory HMR, no persistence          |
| Production    | Tauri `tauri://` protocol from `dist/`   | WebView2 / WKWebView module cache      |
| Cross-session | App bundle replaces all assets on update | New content hash invalidates old cache |
