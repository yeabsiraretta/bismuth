import { ipcCall } from '@/utils/ipc';
import type { SettingsBlock } from '@/types/style-settings';

/** Scan all CSS files for @settings blocks via Tauri backend. */
export async function scanStyleSettings(): Promise<SettingsBlock[]> {
  return ipcCall<SettingsBlock[]>('scan_style_settings');
}

/** Save custom token overrides to vault .bismuth/style.json */
export async function saveCustomTokens(
  vaultRoot: string,
  tokens: Record<string, string>
): Promise<void> {
  await ipcCall<void>('save_custom_tokens', { vaultRoot, tokens });
}

/** Load custom token overrides from vault .bismuth/style.json */
export async function loadCustomTokens(vaultRoot: string): Promise<Record<string, string>> {
  return ipcCall<Record<string, string>>('load_custom_tokens', { vaultRoot });
}
