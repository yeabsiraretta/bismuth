import { writable, get } from 'svelte/store';
import type { CanvasElement } from '@/types/canvas';
import { currentCanvas } from './canvasStore';
import { log } from '@/utils/logger';

// Command interface
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

// Command implementations
export class CreateElementCommand implements Command {
  description = 'Create element';
  
  constructor(private element: CanvasElement) {}

  execute(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      canvas.elements.push(this.element);
      canvas.modified_at = Math.floor(Date.now() / 1000);
      return canvas;
    });
  }

  undo(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      canvas.elements = canvas.elements.filter((e) => e.id !== this.element.id);
      canvas.modified_at = Math.floor(Date.now() / 1000);
      return canvas;
    });
  }
}

export class DeleteElementCommand implements Command {
  description = 'Delete element';
  
  constructor(private element: CanvasElement) {}

  execute(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      canvas.elements = canvas.elements.filter((e) => e.id !== this.element.id);
      canvas.modified_at = Math.floor(Date.now() / 1000);
      return canvas;
    });
  }

  undo(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      canvas.elements.push(this.element);
      canvas.modified_at = Math.floor(Date.now() / 1000);
      return canvas;
    });
  }
}

export class UpdateElementCommand implements Command {
  description = 'Update element';
  
  constructor(
    private elementId: string,
    private oldState: CanvasElement,
    private newState: CanvasElement
  ) {}

  execute(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const index = canvas.elements.findIndex((e) => e.id === this.elementId);
      if (index !== -1) {
        canvas.elements[index] = this.newState;
        canvas.modified_at = Math.floor(Date.now() / 1000);
      }
      return canvas;
    });
  }

  undo(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const index = canvas.elements.findIndex((e) => e.id === this.elementId);
      if (index !== -1) {
        canvas.elements[index] = this.oldState;
        canvas.modified_at = Math.floor(Date.now() / 1000);
      }
      return canvas;
    });
  }
}

export class MoveElementCommand implements Command {
  description = 'Move element';
  
  constructor(
    private elementId: string,
    private oldX: number,
    private oldY: number,
    private newX: number,
    private newY: number
  ) {}

  execute(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const element = canvas.elements.find((e) => e.id === this.elementId);
      if (element) {
        element.x = this.newX;
        element.y = this.newY;
        canvas.modified_at = Math.floor(Date.now() / 1000);
      }
      return canvas;
    });
  }

  undo(): void {
    currentCanvas.update((canvas) => {
      if (!canvas) return canvas;
      const element = canvas.elements.find((e) => e.id === this.elementId);
      if (element) {
        element.x = this.oldX;
        element.y = this.oldY;
        canvas.modified_at = Math.floor(Date.now() / 1000);
      }
      return canvas;
    });
  }
}

export class BatchCommand implements Command {
  description: string;
  
  constructor(private commands: Command[], description: string = 'Batch operation') {
    this.description = description;
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// History state
interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxSize: number;
}

const initialState: HistoryState = {
  undoStack: [],
  redoStack: [],
  maxSize: 50,
};

export const historyState = writable<HistoryState>(initialState);

// Derived stores
export const canUndo = writable(false);
export const canRedo = writable(false);

// Update can undo/redo when history changes
historyState.subscribe((state) => {
  canUndo.set(state.undoStack.length > 0);
  canRedo.set(state.redoStack.length > 0);
});

// Execute a command and add to history
export function executeCommand(command: Command) {
  command.execute();
  
  historyState.update((state) => {
    // Add to undo stack
    state.undoStack.push(command);
    
    // Limit stack size
    if (state.undoStack.length > state.maxSize) {
      state.undoStack.shift();
    }
    
    // Clear redo stack when new command is executed
    state.redoStack = [];
    
    return state;
  });
  
  log.debug('Command executed', { description: command.description });
}

// Undo last command
export function undo() {
  const state = get(historyState);
  
  if (state.undoStack.length === 0) {
    log.warn('Nothing to undo');
    return;
  }
  
  const command = state.undoStack.pop()!;
  command.undo();
  
  historyState.update((s) => {
    s.redoStack.push(command);
    return s;
  });
  
  log.info('Undo', { description: command.description });
}

// Redo last undone command
export function redo() {
  const state = get(historyState);
  
  if (state.redoStack.length === 0) {
    log.warn('Nothing to redo');
    return;
  }
  
  const command = state.redoStack.pop()!;
  command.execute();
  
  historyState.update((s) => {
    s.undoStack.push(command);
    return s;
  });
  
  log.info('Redo', { description: command.description });
}

// Clear history
export function clearHistory() {
  historyState.set(initialState);
  log.debug('History cleared');
}

// Get history info
export function getHistoryInfo(): { undoCount: number; redoCount: number } {
  const state = get(historyState);
  return {
    undoCount: state.undoStack.length,
    redoCount: state.redoStack.length,
  };
}
