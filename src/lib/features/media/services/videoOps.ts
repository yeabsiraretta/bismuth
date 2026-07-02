/**
 * Video operations — BLOCKED pending COOP/COEP header verification.
 * See docs/development/coop-coep-verification.md
 *
 * ffmpeg.wasm requires SharedArrayBuffer for multi-threaded operation.
 * SharedArrayBuffer is only available in cross-origin-isolated contexts,
 * which requires COOP + COEP response headers from the Tauri WebView.
 *
 * VIDEO WORK IS BLOCKED until the manual verification checklist passes on
 * all three target platforms (macOS, Windows, Linux).
 */

import type { VideoOperation } from '../types/media';

/**
 * Check whether the current WebView context is cross-origin-isolated.
 * SharedArrayBuffer (required by ffmpeg.wasm) is only available when this returns true.
 */
export async function checkCoopCoepAvailable(): Promise<boolean> {
  return (
    typeof SharedArrayBuffer !== 'undefined' &&
    (self as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated === true
  );
}

/**
 * Apply video operations using ffmpeg.wasm.
 *
 * NOT IMPLEMENTED — blocked on COOP/COEP verification.
 * See docs/development/coop-coep-verification.md for the checklist.
 *
 * @throws Always throws until COOP/COEP headers are verified.
 */
export async function applyVideoOps(_videoPath: string, _ops: VideoOperation[]): Promise<string> {
  throw new Error(
    'Video editing requires COOP/COEP headers — see docs/development/coop-coep-verification.md'
  );
}
