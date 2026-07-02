/**
 * Vimrc loader — reads .obsidian.vimrc from the vault and applies
 * parsed commands to CodeMirror's Vim mode at runtime.
 */

import { get } from 'svelte/store';
import { currentVault } from '@/stores/vault/vault';
import { readFileText } from '@/services/vault/vault';
import { log } from '@/utils/logger';
import { parseVimrc, expandLeader, extractLeader, extractSetOptions } from './vimrcParser';
import type { VimrcCommand, VimrcParseResult } from './vimrcParser';

// ─── State ──────────────────────────────────────────────────────────────────

let lastLoadedContent = '';
let lastParseResult: VimrcParseResult | null = null;

// ─── Public API ─────────────────────────────────────────────────────────────

export async function loadVimrc(vimrcPath: string): Promise<VimrcParseResult | null> {
  const vault = get(currentVault);
  if (!vault) {
    log.warn('Vimrc loader: no vault open');
    return null;
  }

  const fullPath = `${vault.root_path}/${vimrcPath}`;
  try {
    const content = await readFileText(fullPath);
    if (content === lastLoadedContent && lastParseResult) {
      return lastParseResult;
    }
    lastLoadedContent = content;
    lastParseResult = parseVimrc(content);

    if (lastParseResult.errors.length > 0) {
      log.warn('Vimrc parse errors', { errors: lastParseResult.errors });
    }
    log.info('Vimrc loaded', {
      path: vimrcPath,
      commands: lastParseResult.commands.length,
    });
    return lastParseResult;
  } catch {
    log.debug('Vimrc file not found or unreadable', { path: fullPath });
    return null;
  }
}

/**
 * Apply parsed vimrc commands to the CodeMirror Vim instance.
 * Requires the Vim object from @replit/codemirror-vim.
 */
export function applyVimrcCommands(Vim: VimApi, commands: VimrcCommand[]): void {
  const leader = extractLeader(commands);
  const setOpts = extractSetOptions(commands);
  const exmaps = new Map<string, string>();

  for (const cmd of commands) {
    try {
      switch (cmd.type) {
        case 'exmap': {
          const [name, ...rest] = cmd.args;
          exmaps.set(name, rest.join(' '));
          break;
        }
        case 'map':
        case 'nmap':
        case 'imap':
        case 'vmap':
        case 'noremap': {
          const [lhs, ...rhsParts] = cmd.args;
          const rhs = rhsParts.join(' ');
          const expandedLhs = expandLeader(lhs, leader);
          const expandedRhs = expandLeader(rhs, leader);
          Vim.map(expandedLhs, expandedRhs, getModeForCmd(cmd.type));
          break;
        }
        case 'unmap':
        case 'nunmap':
        case 'iunmap':
        case 'vunmap': {
          const [lhs] = cmd.args;
          const expandedLhs = expandLeader(lhs, leader);
          Vim.unmap(expandedLhs, getModeForCmd(cmd.type));
          break;
        }
        case 'set': {
          // Handled via extractSetOptions
          break;
        }
        case 'let': {
          // Leader key handled above
          break;
        }
        default:
          break;
      }
    } catch (e) {
      log.warn('Vimrc command failed', { line: cmd.line, raw: cmd.raw, error: String(e) });
    }
  }

  // Apply set options
  for (const opt of setOpts) {
    try {
      if (opt.key === 'clipboard' && (opt.value === 'unnamed' || opt.value === 'unnamedplus')) {
        Vim.setOption('clipboard', 'unnamed');
      } else if (opt.key === 'tabstop' && typeof opt.value === 'string') {
        Vim.setOption('tabstop', parseInt(opt.value, 10));
      }
    } catch (e) {
      log.warn('Vimrc set option failed', { key: opt.key, error: String(e) });
    }
  }

  log.info('Vimrc commands applied', {
    mappings: commands.filter((c) => ['map', 'nmap', 'imap', 'vmap', 'noremap'].includes(c.type))
      .length,
    exmaps: exmaps.size,
    setOptions: setOpts.length,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getModeForCmd(type: string): string | undefined {
  switch (type) {
    case 'nmap':
    case 'nunmap':
      return 'normal';
    case 'imap':
    case 'iunmap':
      return 'insert';
    case 'vmap':
    case 'vunmap':
      return 'visual';
    default:
      return undefined;
  }
}

export function getLastParseResult(): VimrcParseResult | null {
  return lastParseResult;
}

export function clearVimrcCache(): void {
  lastLoadedContent = '';
  lastParseResult = null;
}

// ─── Vim API interface (subset of @replit/codemirror-vim's Vim object) ───

export interface VimApi {
  map(lhs: string, rhs: string, mode?: string): void;
  unmap(lhs: string, mode?: string): void;
  setOption(name: string, value: unknown): void;
}
