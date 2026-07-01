/**
 * Theme IPC Commands — Theme and style settings
 */

interface CommandContract<P, R> { params: P; result: R }

export interface ThemeCommands {
  initialize_theme_service: CommandContract<{ vaultPath: string }, void>;
  get_available_themes: CommandContract<Record<string, never>, string[]>;
  load_theme: CommandContract<{ themeName: string }, unknown>;
  get_theme_style_settings: CommandContract<Record<string, never>, unknown>;
  scan_style_settings: CommandContract<Record<string, never>, unknown>;
  get_plugins: CommandContract<Record<string, never>, unknown[]>;
  initialize_plugins: CommandContract<{ vaultPath: string }, void>;
  set_plugin_enabled: CommandContract<{ pluginId: string; enabled: boolean }, void>;
}
