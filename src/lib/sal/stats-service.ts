import { invokeCommand } from '@/ipc/invoke';

import type { VaultStats } from '@/hubs/knowledge/services/vault-statistics';

export type NativeVaultStats = VaultStats;

export async function computeVaultStatsNative(): Promise<NativeVaultStats> {
  return invokeCommand<NativeVaultStats>('compute_vault_stats');
}
