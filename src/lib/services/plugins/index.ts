/**
 * Plugin management service (FR-012)
 *
 * Provides IPC wrappers for discovering, loading, and managing plugins
 * from the vault's `.bismuth/plugins/` directory.
 *
 * @module services/plugins
 */

import { invoke } from '@tauri-apps/api/core';
import { writable } from 'svelte/store';
import { log } from '@/utils/logger';

/** Plugin status as reported by the Rust backend. */
export type PluginStatus = 'active' | 'error' | 'disabled';

/** Plugin manifest data from `plugin.json`. */
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

/** A loaded plugin with status and directory information. */
export interface LoadedPlugin {
  manifest: PluginManifest;
  dir: string;
  status: PluginStatus;
}

/** Reactive plugin store state. */
export interface PluginStoreState {
  plugins: LoadedPlugin[];
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PluginStoreState = {
  plugins: [],
  initialized: false,
  loading: false,
  error: null,
};

function createPluginStore() {
  const { subscribe, update, set } = writable<PluginStoreState>(initialState);

  return {
    subscribe,

    /**
     * Initialize the plugin system for the given vault root.
     * Scans the plugins directory and loads all manifests.
     */
    initialize: async (vaultRoot: string): Promise<void> => {
      update((s: PluginStoreState) => ({ ...s, loading: true, error: null }));
      try {
        const plugins = await invoke<LoadedPlugin[]>('initialize_plugins', {
          vaultRoot,
        });
        update((s: PluginStoreState) => ({
          ...s,
          plugins,
          initialized: true,
          loading: false,
        }));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        update((s: PluginStoreState) => ({
          ...s,
          error: msg,
          loading: false,
        }));
      }
    },

    /** Refresh the plugin list from the backend. */
    refresh: async (): Promise<void> => {
      try {
        const plugins = await invoke<LoadedPlugin[]>('get_plugins');
        update((s: PluginStoreState) => ({ ...s, plugins }));
      } catch (error) {
        log.error('Failed to refresh plugins', error as Error);
      }
    },

    /**
     * Enable or disable a plugin by its ID.
     * Persists the change to the plugin's `plugin.json` manifest.
     */
    setEnabled: async (id: string, enabled: boolean): Promise<void> => {
      try {
        await invoke('set_plugin_enabled', { id, enabled });
        update((s: PluginStoreState) => ({
          ...s,
          plugins: s.plugins.map((p: LoadedPlugin) =>
            p.manifest.id === id
              ? {
                  ...p,
                  manifest: { ...p.manifest, enabled },
                  status: enabled ? 'active' : ('disabled' as PluginStatus),
                }
              : p
          ),
        }));
      } catch (error) {
        log.error(`Failed to update plugin ${id}`, error as Error);
      }
    },

    /** Get only active plugins. */
    getActive: (state: PluginStoreState): LoadedPlugin[] => {
      return state.plugins.filter((p) => p.status === 'active');
    },

    /** Reset the store (e.g., on vault close). */
    reset: (): void => {
      set(initialState);
    },
  };
}

export const pluginStore = createPluginStore();
