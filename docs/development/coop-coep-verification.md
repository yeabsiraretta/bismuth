# COOP/COEP Verification for ffmpeg.wasm

## Why These Headers Are Required

`ffmpeg.wasm` uses WebAssembly threads via `SharedArrayBuffer`. Browser security
policy requires that `SharedArrayBuffer` is only available in **cross-origin-isolated**
contexts, which requires two HTTP response headers:

| Header | Required Value |
|---|---|
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Embedder-Policy` | `require-corp` |

When both headers are present and correct, `window.crossOriginIsolated` returns `true`
and `SharedArrayBuffer` becomes available. Without them, `ffmpeg.wasm` falls back to
single-threaded mode or fails to load entirely.

## Tauri 2 Configuration

Add the headers to `src-tauri/tauri.conf.json` under `app.security`:

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src blob: 'self'",
      "headers": {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp"
      }
    }
  }
}
```

Notes:
- The CSP must include `wasm-unsafe-eval` to allow WebAssembly compilation.
- `worker-src blob:` is required because ffmpeg.wasm spawns Worker threads from blob URLs.
- On macOS, WKWebView respects these headers. On Windows, WebView2 also respects them
  as of version 101+. On Linux, WebKitGTK 2.38+ respects them.

## Manual Verification Checklist

Perform this check on every target platform before implementing Phase 5+ (video editing).

### Step 1 — Apply Headers

Confirm that `tauri.conf.json` contains the COOP/COEP headers shown above.

### Step 2 — Build and Run

```bash
pnpm tauri dev
```

### Step 3 — Open DevTools and Run Checks

Open the Tauri WebView developer console and run:

```javascript
// Check 1: SharedArrayBuffer available
console.assert(typeof SharedArrayBuffer !== 'undefined', 'SharedArrayBuffer NOT available');

// Check 2: Cross-origin isolated
console.assert(window.crossOriginIsolated === true, 'NOT cross-origin-isolated');

// Check 3: ffmpeg.wasm loads (lazy import)
const { FFmpeg } = await import('@ffmpeg/ffmpeg');
const ff = new FFmpeg();
await ff.load();
console.log('ffmpeg.wasm loaded OK');
```

All three assertions must pass before proceeding to video work.

### Platform Results

| Platform | WebView Engine | SharedArrayBuffer | crossOriginIsolated | ffmpeg.wasm loads | Verified By | Date |
|---|---|---|---|---|---|---|
| macOS 14+ | WKWebView | [ ] | [ ] | [ ] | | |
| Windows 11 | WebView2 | [ ] | [ ] | [ ] | | |
| Linux (Ubuntu 22.04) | WebKitGTK 2.38+ | [ ] | [ ] | [ ] | | |

Fill in this table with actual results before merging Phase 5.

## Single-Threaded Fallback

If any platform fails the `crossOriginIsolated` check:

1. Use the `@ffmpeg/ffmpeg` single-threaded build:
   ```typescript
   import { FFmpeg } from '@ffmpeg/ffmpeg';
   const ff = new FFmpeg();
   await ff.load({
     coreURL: 'https://unpkg.com/@ffmpeg/core-mt@latest/dist/esm/ffmpeg-core.js',
     // Use single-threaded core if MT unavailable:
     // coreURL: 'https://unpkg.com/@ffmpeg/core@latest/dist/esm/ffmpeg-core.js',
   });
   ```

2. Single-threaded mode is approximately 3-5x slower for video operations.
3. Document the affected platform and the fallback in `specs/047-media-editing/coop-coep-verification.md`.

## VIDEO WORK IS BLOCKED

**Phase 5 (video editing) implementation MUST NOT begin until the table above is fully
filled in and all three platforms show passing results (or fallback is documented).**

See `src/lib/features/media/services/videoOps.ts` for the blocked implementation stub.
