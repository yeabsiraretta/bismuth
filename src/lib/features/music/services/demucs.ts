/**
 * Demucs stem-splitting service — all invoke() calls for Demucs are confined here.
 *
 * The Rust side currently returns Err("demucs_not_installed") as a graceful stub.
 * When demucs is installed, the command returns stem file paths.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export interface StemPaths {
  vocals: string;
  drums: string;
  bass: string;
  other: string;
}

/**
 * Split an audio file into stems using Demucs.
 * Returns an object with paths to the four stem files.
 * Throws with message "demucs_not_installed" when Demucs binary is absent.
 */
export async function splitStems(audioPath: string, vaultRoot: string): Promise<StemPaths> {
  log.info('[demucs] splitStems', { audioPath });
  const result = await invoke<StemPaths>('split_stems', { audioPath, vaultRoot });
  log.info('[demucs] splitStems complete', { vocals: result.vocals });
  return result;
}
