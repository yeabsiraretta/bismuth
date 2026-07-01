/**
 * MetaBind feature module — interactive inline fields for notes.
 *
 * Inspired by Obsidian Meta Bind plugin. Enables:
 *   `INPUT[toggle:done]`     — interactive toggle bound to frontmatter
 *   `VIEW[progress:hp(max=100)]` — read-only progress bar display
 *   `BUTTON[Archive:update(lifecycle=archived)]` — action button
 *
 * Public API barrel.
 */

// Types
export type {
  InputFieldType,
  InputFieldDeclaration,
  InputFieldOptions,
  ViewFieldType,
  ViewFieldDeclaration,
  ViewFieldOptions,
  ButtonAction,
  ButtonDeclaration,
  ButtonOptions,
  MetaBindDeclaration,
  MetaBindMatch,
} from './types/metabind';

// Parser
export { parseMetaBindSyntax, isMetaBindSyntax } from './services/metabindParser';

// Extension
export { metabindExtension } from './extensions/metabindExtension';
export { metabindTheme } from './extensions/metabindTheme';
