/**
 * Vault-related type definitions
 * @module types/vault
 */

/**
 * Represents a vault (collection of notes)
 * @interface Vault
 */
export interface Vault {
  /** Absolute path to vault root directory */
  rootPath: string;
  /** Vault name (directory name) */
  name: string;
  /** Path to vault settings file */
  settingsPath: string;
  /** Vault configuration */
  config: VaultConfig;
}

/**
 * Vault configuration settings
 * @interface VaultConfig
 */
export interface VaultConfig {
  /** Theme name */
  theme?: string;
  /** Enable Johnny.Decimal organization */
  useJohnnyDecimal?: boolean;
  /** Enable Zettelkasten features */
  useZettelkasten?: boolean;
  /** Default note template */
  defaultTemplate?: string;
  /** Folders to exclude from indexing */
  excludedFolders?: string[];
}

/**
 * Vault template types
 * @enum VaultTemplate
 */
export enum VaultTemplate {
  Blank = 'Blank',
  PARA = 'PARA',
  JohnnyDecimal = 'JohnnyDecimal',
  Zettelkasten = 'Zettelkasten',
}

/**
 * File system event
 * @interface FileEvent
 */
export interface FileEvent {
  /** Event type */
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  /** File path */
  path: string;
  /** Old path (for rename events) */
  oldPath?: string;
  /** Event timestamp */
  timestamp: Date;
}
