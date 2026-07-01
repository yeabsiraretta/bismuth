/**
 * Action helpers for SettingsModal — extracted to stay under 300-line limit.
 */
import { log } from '@/utils/logger';
import { openInFileManager } from '@/services/vault/vault';

export async function openVaultFolder(vaultPath: string): Promise<void> {
  if (!vaultPath) return;
  try {
    await openInFileManager(vaultPath);
    log.info('Opened vault folder');
  } catch (error) {
    log.error('Failed to open vault folder', error as Error);
  }
}
