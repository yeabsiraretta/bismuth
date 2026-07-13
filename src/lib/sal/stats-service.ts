import { invoke } from '@tauri-apps/api/core';

import type { VaultStats } from '@/hubs/knowledge/services/vault-statistics';

export type NativeVaultStats = VaultStats;

export async function computeVaultStatsNative(): Promise<NativeVaultStats> {
  return invoke<NativeVaultStats>('compute_vault_stats');
}
