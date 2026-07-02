/**
 * LLM vault config service — IPC wrappers for per-vault LLM configuration.
 * All invoke() calls for LLM config are isolated here.
 */
import { ipcCall } from '@/utils/ipc';
import type { VaultLlmConfig } from '../types/llm';

/**
 * Reads the vault LLM config. Returns defaults if the config file is absent.
 */
export async function readVaultLlmConfig(vaultRoot: string): Promise<VaultLlmConfig> {
  return ipcCall<VaultLlmConfig>('read_vault_llm_config', { vaultRoot });
}

/**
 * Writes the vault LLM config. Validates port range on the Rust side.
 */
export async function writeVaultLlmConfig(
  vaultRoot: string,
  config: VaultLlmConfig
): Promise<void> {
  return ipcCall<void>('write_vault_llm_config', { vaultRoot, config });
}
