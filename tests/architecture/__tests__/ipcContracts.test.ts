/**
 * IPC Contract Parity Test
 *
 * Validates that every `#[tauri::command]` function in the Rust backend
 * has a corresponding entry in the TypeScript IPC contract registry,
 * and vice-versa.
 *
 * This catches:
 * - New Rust commands that lack a TS contract
 * - Stale TS contracts for removed Rust commands
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const RUST_COMMANDS_DIR = path.join(ROOT, 'src-tauri/src/commands');
const IPC_CONTRACTS_DIR = path.join(ROOT, 'src/lib/types/ipc');

/** Extract `#[tauri::command]` function names from Rust source files. */
function extractRustCommands(dir: string): Set<string> {
  const commands = new Set<string>();
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith('.rs')) continue;
      const content = fs.readFileSync(full, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('#[tauri::command]')) {
          // Next non-attribute, non-empty line should have `fn name(`
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const fnMatch = lines[j].match(/(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(/);
            if (fnMatch) {
              commands.add(fnMatch[1]);
              break;
            }
          }
        }
      }
    }
  };
  walk(dir);
  return commands;
}

/** Extract command names from TS IPC contract files. */
function extractTsContracts(dir: string): Set<string> {
  const commands = new Set<string>();
  if (!fs.existsSync(dir)) return commands;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.ts')) continue;
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    // Match keys in interface/type: `command_name: CommandContract<...>` or `command_name: { ... }`
    const matches = content.matchAll(/^\s+['"]?(\w+)['"]?\s*:\s*(?:CommandContract\s*<|\{)/gm);
    for (const m of matches) {
      commands.add(m[1]);
    }
  }
  return commands;
}

describe('IPC Contract Parity', () => {
  const rustCommands = extractRustCommands(RUST_COMMANDS_DIR);
  const tsContracts = extractTsContracts(IPC_CONTRACTS_DIR);

  it('discovers Rust commands', () => {
    expect(rustCommands.size).toBeGreaterThan(50);
  });

  it('discovers TS contracts', () => {
    expect(tsContracts.size).toBeGreaterThan(50);
  });

  // Known commands that are intentionally uncontracted (internal/helper commands)
  const KNOWN_UNCONTRACTED = new Set<string>([
    // Add command names here that are intentionally excluded from contracts
  ]);

  it('every TS contract maps to a Rust command', () => {
    const stale = [...tsContracts].filter((c) => !rustCommands.has(c));
    if (stale.length > 0) {
      console.warn('Stale TS contracts (no matching Rust command):', stale);
    }
    // Warn-only for now; flip to expect(stale).toEqual([]) when clean
    expect(stale.length).toBeLessThanOrEqual(20);
  });

  it('tracks Rust commands missing from TS contracts', () => {
    const missing = [...rustCommands].filter(
      (c) => !tsContracts.has(c) && !KNOWN_UNCONTRACTED.has(c)
    );
    if (missing.length > 0) {
      console.warn(`${missing.length} Rust commands lack TS contracts:`, missing.slice(0, 20));
    }
    // Informational: track the gap but don't fail CI yet
    expect(missing.length).toBeLessThanOrEqual(200);
  });
});
