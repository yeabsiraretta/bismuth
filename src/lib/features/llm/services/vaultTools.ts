/**
 * Vault tools — built-in tool definitions the agent can call to interact with the vault.
 * Each tool maps to an existing vault service function.
 */

import { get } from 'svelte/store';
import { currentVault } from '@/stores/vault/vault';
import { readFileText, writeNote, createFolder } from '@/services/vault/vault';
import { scanVault, scanVaultMeta, deleteNote, renameNote } from '@/services/vault/vault';
import { log } from '@/utils/logger';
import type { ToolDefinition, ToolResult } from '../types/llm';

/** All built-in vault tools. */
export const VAULT_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description:
      'Read the contents of a file in the vault. Returns the file content as UTF-8 text.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to vault root, or absolute path' },
      },
      required: ['path'],
    },
    source: 'vault',
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the vault. Creates or overwrites the file.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to vault root' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
    source: 'vault',
  },
  {
    name: 'list_files',
    description: 'List all markdown notes in the vault with their titles and paths.',
    inputSchema: { type: 'object', properties: {} },
    source: 'vault',
  },
  {
    name: 'search_vault',
    description:
      'Search for text across all notes in the vault. Returns matching file paths and snippets.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query string' } },
      required: ['query'],
    },
    source: 'vault',
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in the vault.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Folder path to create' } },
      required: ['path'],
    },
    source: 'vault',
  },
  {
    name: 'delete_file',
    description: 'Delete a file from the vault.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path to delete' } },
      required: ['path'],
    },
    source: 'vault',
  },
  {
    name: 'rename_file',
    description: 'Rename or move a file within the vault.',
    inputSchema: {
      type: 'object',
      properties: {
        oldPath: { type: 'string', description: 'Current file path' },
        newPath: { type: 'string', description: 'New file path' },
      },
      required: ['oldPath', 'newPath'],
    },
    source: 'vault',
  },
];

/**
 * Resolve a relative path to an absolute vault path.
 */
function resolveVaultPath(relativePath: string): string {
  const vault = get(currentVault);
  if (!vault) throw new Error('No vault open');
  if (relativePath.startsWith('/')) return relativePath;
  return `${vault.root_path}/${relativePath}`.replace(/\/+/g, '/');
}

/**
 * Execute a vault tool by name with the given arguments.
 * Returns a ToolResult with output or error.
 */
export async function executeVaultTool(
  toolCallId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    let output: string;

    switch (toolName) {
      case 'read_file': {
        const path = resolveVaultPath(args['path'] as string);
        output = await readFileText(path);
        break;
      }

      case 'write_file': {
        const path = resolveVaultPath(args['path'] as string);
        await writeNote(path, args['content'] as string);
        output = `File written: ${args['path']}`;
        break;
      }

      case 'list_files': {
        const notes = await scanVaultMeta();
        output = notes.map((n) => `${n.path} — ${n.title}`).join('\n');
        break;
      }

      case 'search_vault': {
        const query = (args['query'] as string).toLowerCase();
        const allNotes = await scanVault();
        const matches = allNotes
          .filter(
            (n) => n.content.toLowerCase().includes(query) || n.title.toLowerCase().includes(query)
          )
          .slice(0, 20);
        if (matches.length === 0) {
          output = `No results for "${args['query']}"`;
        } else {
          output = matches
            .map((n) => {
              const idx = n.content.toLowerCase().indexOf(query);
              const snippet =
                idx >= 0
                  ? n.content.slice(Math.max(0, idx - 40), idx + query.length + 40).trim()
                  : '';
              return `${n.path}: ...${snippet}...`;
            })
            .join('\n');
        }
        break;
      }

      case 'create_folder': {
        const path = resolveVaultPath(args['path'] as string);
        await createFolder(path);
        output = `Folder created: ${args['path']}`;
        break;
      }

      case 'delete_file': {
        const path = resolveVaultPath(args['path'] as string);
        await deleteNote(path);
        output = `File deleted: ${args['path']}`;
        break;
      }

      case 'rename_file': {
        const oldPath = resolveVaultPath(args['oldPath'] as string);
        const newPath = resolveVaultPath(args['newPath'] as string);
        await renameNote(oldPath, newPath);
        output = `File renamed: ${args['oldPath']} → ${args['newPath']}`;
        break;
      }

      default:
        return { toolCallId, toolName, output: `Unknown tool: ${toolName}`, isError: true };
    }

    log.info('Vault tool executed', { toolName, args });
    return { toolCallId, toolName, output, isError: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Vault tool failed', err as Error, { toolName });
    return { toolCallId, toolName, output: `Tool error: ${msg}`, isError: true };
  }
}
