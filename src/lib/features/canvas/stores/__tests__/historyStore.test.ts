import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@tauri-apps/api/core');
vi.mock('@tauri-apps/api/event');
vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  historyState,
  canUndo,
  canRedo,
  executeCommand,
  undo,
  redo,
  clearHistory,
  getHistoryInfo,
  BatchCommand,
} from '../history/historyStore';
import type { Command } from '../history/historyStore';

function makeCmd(desc = 'test'): Command & { executed: boolean; undone: boolean } {
  const cmd = {
    description: desc,
    executed: false,
    undone: false,
    execute() { cmd.executed = true; cmd.undone = false; },
    undo() { cmd.undone = true; cmd.executed = false; },
  };
  return cmd;
}

describe('historyStore', () => {
  beforeEach(() => {
    historyState.set({ undoStack: [], redoStack: [], maxSize: 50 });
  });

  describe('executeCommand', () => {
    it('executes the command', () => {
      const cmd = makeCmd();
      executeCommand(cmd);
      expect(cmd.executed).toBe(true);
    });

    it('pushes command onto undo stack', () => {
      executeCommand(makeCmd());
      expect(getHistoryInfo().undoCount).toBe(1);
    });

    it('clears redo stack on new command', () => {
      executeCommand(makeCmd('a'));
      undo();
      expect(getHistoryInfo().redoCount).toBe(1);
      executeCommand(makeCmd('b'));
      expect(getHistoryInfo().redoCount).toBe(0);
    });

    it('limits undo stack to maxSize', () => {
      for (let i = 0; i < 60; i++) {
        executeCommand(makeCmd(`cmd-${i}`));
      }
      expect(getHistoryInfo().undoCount).toBe(50);
    });
  });

  describe('undo', () => {
    it('undoes the last command', () => {
      const cmd = makeCmd();
      executeCommand(cmd);
      undo();
      expect(cmd.undone).toBe(true);
    });

    it('moves command to redo stack', () => {
      executeCommand(makeCmd());
      undo();
      expect(getHistoryInfo().undoCount).toBe(0);
      expect(getHistoryInfo().redoCount).toBe(1);
    });

    it('does nothing when undo stack is empty', () => {
      undo();
      expect(getHistoryInfo().undoCount).toBe(0);
    });
  });

  describe('redo', () => {
    it('re-executes the undone command', () => {
      const cmd = makeCmd();
      executeCommand(cmd);
      undo();
      redo();
      expect(cmd.executed).toBe(true);
    });

    it('moves command back to undo stack', () => {
      executeCommand(makeCmd());
      undo();
      redo();
      expect(getHistoryInfo().undoCount).toBe(1);
      expect(getHistoryInfo().redoCount).toBe(0);
    });

    it('does nothing when redo stack is empty', () => {
      redo();
      expect(getHistoryInfo().redoCount).toBe(0);
    });
  });

  describe('canUndo / canRedo', () => {
    it('canUndo is false initially', () => {
      expect(get(canUndo)).toBe(false);
    });

    it('canUndo becomes true after execute', () => {
      executeCommand(makeCmd());
      expect(get(canUndo)).toBe(true);
    });

    it('canRedo becomes true after undo', () => {
      executeCommand(makeCmd());
      undo();
      expect(get(canRedo)).toBe(true);
    });

    it('canRedo becomes false after new execute', () => {
      executeCommand(makeCmd());
      undo();
      executeCommand(makeCmd());
      expect(get(canRedo)).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('resets both stacks', () => {
      executeCommand(makeCmd());
      executeCommand(makeCmd());
      undo();
      clearHistory();
      expect(getHistoryInfo().undoCount).toBe(0);
      expect(getHistoryInfo().redoCount).toBe(0);
    });
  });

  describe('BatchCommand', () => {
    it('executes all sub-commands', () => {
      const a = makeCmd('a');
      const b = makeCmd('b');
      const batch = new BatchCommand([a, b], 'batch');
      batch.execute();
      expect(a.executed).toBe(true);
      expect(b.executed).toBe(true);
    });

    it('undoes sub-commands in reverse order', () => {
      const order: string[] = [];
      const a: Command = { description: 'a', execute() {}, undo() { order.push('a'); } };
      const b: Command = { description: 'b', execute() {}, undo() { order.push('b'); } };
      const batch = new BatchCommand([a, b], 'batch');
      batch.undo();
      expect(order).toEqual(['b', 'a']);
    });
  });
});
