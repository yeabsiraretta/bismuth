/**
 * Vimrc file parser — parses .obsidian.vimrc content into executable
 * commands for CodeMirror's vim mode.
 *
 * Supports: map/nmap/imap/vmap/noremap, unmap/nunmap/iunmap/vunmap,
 * exmap, set, let mapleader, source, comments, blank lines.
 */

import { log } from '@/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

export type VimrcCommandType =
  | 'map' | 'nmap' | 'imap' | 'vmap' | 'noremap'
  | 'unmap' | 'nunmap' | 'iunmap' | 'vunmap'
  | 'exmap' | 'set' | 'let' | 'source' | 'unknown';

export interface VimrcCommand {
  type: VimrcCommandType;
  args: string[];
  raw: string;
  line: number;
}

export interface VimrcParseResult {
  commands: VimrcCommand[];
  errors: { line: number; message: string }[];
}

// ─── Parser ─────────────────────────────────────────────────────────────────

const MAP_COMMANDS = new Set<VimrcCommandType>([
  'map', 'nmap', 'imap', 'vmap', 'noremap',
]);
const UNMAP_COMMANDS = new Set<VimrcCommandType>([
  'unmap', 'nunmap', 'iunmap', 'vunmap',
]);
const ALL_COMMANDS = new Set<string>([
  ...MAP_COMMANDS, ...UNMAP_COMMANDS,
  'exmap', 'set', 'let', 'source',
]);

export function parseVimrc(content: string): VimrcParseResult {
  const commands: VimrcCommand[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trimEnd();
    const trimmed = raw.trim();

    // Skip blank lines and comments
    if (trimmed === '' || trimmed.startsWith('"')) continue;

    const firstWord = trimmed.split(/\s+/)[0];
    const cmd = firstWord.toLowerCase();

    // Strip inline comments for map/set commands (skip `let` to preserve quoted values)
    const effective = cmd === 'let' ? trimmed : trimmed.replace(/\s+".*$/, '');
    const parts = effective.split(/\s+/);

    if (!ALL_COMMANDS.has(cmd)) {
      errors.push({ line: i + 1, message: `Unknown command: ${firstWord}` });
      commands.push({ type: 'unknown', args: parts.slice(1), raw, line: i + 1 });
      continue;
    }

    const type = cmd as VimrcCommandType;
    const args = parts.slice(1);

    if ((MAP_COMMANDS.has(type) || UNMAP_COMMANDS.has(type)) && args.length < 1) {
      errors.push({ line: i + 1, message: `${cmd} requires at least 1 argument` });
      continue;
    }

    if (type === 'exmap' && args.length < 2) {
      errors.push({ line: i + 1, message: 'exmap requires a name and command' });
      continue;
    }

    if (type === 'set' && args.length < 1) {
      errors.push({ line: i + 1, message: 'set requires an option' });
      continue;
    }

    commands.push({ type, args, raw, line: i + 1 });
  }

  log.debug('Vimrc parsed', { commandCount: commands.length, errorCount: errors.length });
  return { commands, errors };
}

// ─── Leader key expansion ───────────────────────────────────────────────────

export function expandLeader(mapping: string, leader: string): string {
  return mapping.replace(/<leader>/gi, leader);
}

export function extractLeader(commands: VimrcCommand[]): string {
  let leader = '\\';
  for (const cmd of commands) {
    if (cmd.type !== 'let') continue;
    // Parse from raw: `let mapleader = "X"` — extract value after `=`
    const match = cmd.raw.match(/let\s+mapleader\s*=\s*["'](.+?)["']/i);
    if (match && match[1]) leader = match[1];
  }
  return leader;
}

// ─── Set option extraction ──────────────────────────────────────────────────

export interface VimSetOption {
  key: string;
  value: string | true;
}

export function extractSetOptions(commands: VimrcCommand[]): VimSetOption[] {
  return commands
    .filter(c => c.type === 'set')
    .map(c => {
      const [option] = c.args;
      const eqIdx = option.indexOf('=');
      if (eqIdx >= 0) {
        return { key: option.slice(0, eqIdx), value: option.slice(eqIdx + 1) };
      }
      return { key: option, value: true as const };
    });
}
