/**
 * Plugin service — IPC wrappers for vault plugin management.
 *
 * Discovers, loads, enables, and disables plugins from `.bismuth/plugins/`.
 * All Tauri invoke() calls are isolated here per architecture constitution.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';

export type PluginStatus = 'active' | 'error' | 'disabled';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  min_app_version: string | null;
  main: string | null;
  enabled: boolean;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  dir: string;
  status: PluginStatus;
}

export async function initializePlugins(vaultRoot: string): Promise<LoadedPlugin[]> {
  return invoke<LoadedPlugin[]>('initialize_plugins', { vaultRoot });
}

export async function getPlugins(): Promise<LoadedPlugin[]> {
  return invoke<LoadedPlugin[]>('get_plugins');
}

export async function setPluginEnabled(id: string, enabled: boolean): Promise<void> {
  await invoke('set_plugin_enabled', { id, enabled });
  log.info('Plugin enabled state changed', { id, enabled });
}
