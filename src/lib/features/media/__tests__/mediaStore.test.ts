/**
 * Unit tests for mediaStore — state management and history stack.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  activeMediaPath,
  editChain,
  previewDataUrl,
  isDirty,
  loadMediaFile,
  addOperation,
  removeOperation,
  undoOperation,
  redoOperation,
  clearChain,
  resetChain,
} from '../stores/mediaStore';
import type { PhotoOperation } from '../types/media';

beforeEach(() => {
  resetChain();
});

describe('loadMediaFile', () => {
  it('sets activeMediaPath to the provided path', () => {
    loadMediaFile('/vault/photos/test.jpg');
    expect(get(activeMediaPath)).toBe('/vault/photos/test.jpg');
  });

  it('initializes an empty editChain with correct sourcePath', () => {
    loadMediaFile('/vault/photos/test.jpg');
    const chain = get(editChain);
    expect(chain).not.toBeNull();
    expect(chain!.sourcePath).toBe('/vault/photos/test.jpg');
    expect(chain!.operations).toHaveLength(0);
  });

  it('clears the previewDataUrl on load', () => {
    previewDataUrl.set('data:image/jpeg;base64,abc');
    loadMediaFile('/vault/photos/test.jpg');
    expect(get(previewDataUrl)).toBeNull();
  });
});

describe('addOperation', () => {
  it('appends the operation to the chain', () => {
    loadMediaFile('/vault/photos/test.jpg');
    const op: PhotoOperation = { type: 'brightness', params: { value: 1.2 } };
    addOperation(op);
    const chain = get(editChain);
    expect(chain!.operations).toHaveLength(1);
    expect(chain!.operations[0].type).toBe('brightness');
  });

  it('isDirty becomes true after addOperation', () => {
    loadMediaFile('/vault/photos/test.jpg');
    expect(get(isDirty)).toBe(false);
    addOperation({ type: 'rotate', params: { angle: 90 } });
    expect(get(isDirty)).toBe(true);
  });

  it('does not append when no chain is active', () => {
    // No loadMediaFile called — editChain is null
    addOperation({ type: 'rotate', params: { angle: 90 } });
    expect(get(editChain)).toBeNull();
  });
});

describe('removeOperation', () => {
  it('removes the operation at the given index', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'rotate', params: { angle: 90 } });
    addOperation({ type: 'brightness', params: { value: 1.5 } });
    removeOperation(0);
    const chain = get(editChain);
    expect(chain!.operations).toHaveLength(1);
    expect(chain!.operations[0].type).toBe('brightness');
  });
});

describe('undoOperation', () => {
  it('removes the last operation from the chain', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'rotate', params: { angle: 90 } });
    addOperation({ type: 'brightness', params: { value: 1.2 } });
    undoOperation();
    const chain = get(editChain);
    expect(chain!.operations).toHaveLength(1);
    expect(chain!.operations[0].type).toBe('rotate');
  });

  it('does nothing when history is empty', () => {
    loadMediaFile('/vault/photos/test.jpg');
    expect(() => undoOperation()).not.toThrow();
    expect(get(editChain)!.operations).toHaveLength(0);
  });
});

describe('redoOperation', () => {
  it('reapplies an undone operation', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'rotate', params: { angle: 90 } });
    undoOperation();
    expect(get(editChain)!.operations).toHaveLength(0);
    redoOperation();
    expect(get(editChain)!.operations).toHaveLength(1);
  });

  it('clears redo stack after a new addOperation', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'rotate', params: { angle: 90 } });
    undoOperation();
    addOperation({ type: 'brightness', params: { value: 1.1 } });
    // redo should now be empty — calling it has no effect
    redoOperation();
    expect(get(editChain)!.operations).toHaveLength(1);
    expect(get(editChain)!.operations[0].type).toBe('brightness');
  });
});

describe('clearChain', () => {
  it('removes all operations without resetting the file path', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'rotate', params: { angle: 90 } });
    clearChain();
    expect(get(editChain)!.operations).toHaveLength(0);
    expect(get(activeMediaPath)).toBe('/vault/photos/test.jpg');
  });
});

describe('resetChain', () => {
  it('clears both activeMediaPath and editChain to null', () => {
    loadMediaFile('/vault/photos/test.jpg');
    addOperation({ type: 'brightness', params: { value: 1.5 } });
    resetChain();
    expect(get(activeMediaPath)).toBeNull();
    expect(get(editChain)).toBeNull();
  });
});
