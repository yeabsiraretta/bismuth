/**
 * IPC Contract Registry
 *
 * Type-safe mapping of all Tauri backend commands to their parameters and return types.
 * This file is the frontend source of truth for the frontend-backend interface.
 *
 * Usage in services:
 *   import type { VaultCommands } from '@/types/ipc-contracts';
 *   const note = await ipcCall<VaultCommands['read_note']['result']>('read_note', { path });
 *
 * Split by domain to stay under file size limits.
 */

export type { VaultCommands } from './ipc/vault-commands';
export type { CanvasCommands } from './ipc/canvas-commands';
export type { ContentCommands } from './ipc/content-commands';
export type { GitCommands } from './ipc/git-commands';
export type { TemplateCommands } from './ipc/template-commands';
export type { ThemeCommands } from './ipc/theme-commands';

/** Union of all IPC command maps */
export type IpcCommandMap =
  import('./ipc/vault-commands').VaultCommands &
  import('./ipc/canvas-commands').CanvasCommands &
  import('./ipc/content-commands').ContentCommands &
  import('./ipc/git-commands').GitCommands &
  import('./ipc/template-commands').TemplateCommands &
  import('./ipc/theme-commands').ThemeCommands;

/** Extract command names as a union type */
export type IpcCommandName = keyof IpcCommandMap;
