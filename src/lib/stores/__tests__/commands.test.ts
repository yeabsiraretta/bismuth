import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  commands,
  registerCommand,
  unregisterCommand,
  executeCommand,
  searchCommands,
} from '../commands';
import type { Command } from '../commands';

function makeCommand(overrides: Partial<Command> = {}): Command {
  return {
    id: 'test:cmd',
    name: 'Test Command',
    description: 'A test command',
    category: 'Testing',
    action: vi.fn(),
    ...overrides,
  };
}

describe('commands store', () => {
  beforeEach(() => {
    // Clear all commands by unregistering known ones
    get(commands).forEach((cmd: Command) => unregisterCommand(cmd.id));
  });

  it('should start with no commands', () => {
    expect(get(commands)).toHaveLength(0);
  });

  it('should register a command', () => {
    registerCommand(makeCommand({ id: 'test:1', name: 'First' }));
    const all = get(commands);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test:1');
    expect(all[0].name).toBe('First');
  });

  it('should register multiple commands', () => {
    registerCommand(makeCommand({ id: 'test:1' }));
    registerCommand(makeCommand({ id: 'test:2' }));
    registerCommand(makeCommand({ id: 'test:3' }));
    expect(get(commands)).toHaveLength(3);
  });

  it('should overwrite command with same ID', () => {
    registerCommand(makeCommand({ id: 'test:1', name: 'Original' }));
    registerCommand(makeCommand({ id: 'test:1', name: 'Updated' }));
    const all = get(commands);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Updated');
  });

  it('should unregister a command', () => {
    registerCommand(makeCommand({ id: 'test:1' }));
    registerCommand(makeCommand({ id: 'test:2' }));
    unregisterCommand('test:1');
    const all = get(commands);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test:2');
  });

  it('should execute a command by ID', async () => {
    const action = vi.fn();
    registerCommand(makeCommand({ id: 'test:exec', action }));
    await executeCommand('test:exec');
    expect(action).toHaveBeenCalledOnce();
  });

  it('should not throw when executing non-existent command', async () => {
    await expect(executeCommand('nonexistent')).resolves.toBeUndefined();
  });

  it('should search commands by name', () => {
    registerCommand(makeCommand({ id: 'note:new', name: 'New Note', category: 'Notes' }));
    registerCommand(makeCommand({ id: 'search:open', name: 'Search', category: 'Navigation' }));
    registerCommand(makeCommand({ id: 'settings:open', name: 'Settings', category: 'App' }));

    const results = searchCommands('note');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('note:new');
  });

  it('should search commands by description', () => {
    registerCommand(makeCommand({ id: 'cmd1', description: 'Opens the vault' }));
    registerCommand(makeCommand({ id: 'cmd2', description: 'Closes the panel' }));

    const results = searchCommands('vault');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cmd1');
  });

  it('should search commands by category', () => {
    registerCommand(makeCommand({ id: 'cmd1', category: 'Navigation' }));
    registerCommand(makeCommand({ id: 'cmd2', category: 'Editing' }));

    const results = searchCommands('edit');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cmd2');
  });

  it('should return all commands on empty query', () => {
    registerCommand(makeCommand({ id: 'cmd1' }));
    registerCommand(makeCommand({ id: 'cmd2' }));
    const results = searchCommands('');
    expect(results).toHaveLength(2);
  });

  it('should prioritize name prefix matches', () => {
    registerCommand(makeCommand({ id: 'cmd1', name: 'Note Create' }));
    registerCommand(makeCommand({ id: 'cmd2', name: 'Create Note' }));

    const results = searchCommands('create');
    expect(results[0].id).toBe('cmd2');
  });
});
