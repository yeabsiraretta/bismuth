import { describe, it, expect } from 'vitest';
import { extractCanvasLinks, isCanvasFile } from '../services/canvasLinks';

describe('isCanvasFile', () => {
  it('returns true for .canvas files', () => {
    expect(isCanvasFile('my-board.canvas')).toBe(true);
    expect(isCanvasFile('folder/board.canvas')).toBe(true);
  });

  it('returns false for non-canvas files', () => {
    expect(isCanvasFile('note.md')).toBe(false);
    expect(isCanvasFile('data.json')).toBe(false);
  });
});

describe('extractCanvasLinks', () => {
  it('extracts file card references', () => {
    const json = JSON.stringify({
      nodes: [
        { id: 'c1', type: 'file', file: 'notes/target.md' },
        { id: 'c2', type: 'file', file: 'assets/image.png' },
      ],
    });
    const links = extractCanvasLinks('board.canvas', json);
    expect(links).toHaveLength(2);
    expect(links[0].targetPath).toBe('notes/target.md');
    expect(links[0].cardType).toBe('file');
    expect(links[0].canvasPath).toBe('board.canvas');
  });

  it('extracts wikilinks from text cards', () => {
    const json = JSON.stringify({
      nodes: [{ id: 't1', type: 'text', text: 'See [[Note A]] and [[Note B]]' }],
    });
    const links = extractCanvasLinks('board.canvas', json);
    expect(links).toHaveLength(2);
    expect(links[0].targetPath).toBe('Note A');
    expect(links[0].cardType).toBe('text');
    expect(links[1].targetPath).toBe('Note B');
  });

  it('handles invalid JSON gracefully', () => {
    const links = extractCanvasLinks('board.canvas', 'not json');
    expect(links).toHaveLength(0);
  });

  it('handles missing nodes array', () => {
    const links = extractCanvasLinks('board.canvas', '{}');
    expect(links).toHaveLength(0);
  });

  it('handles empty canvas', () => {
    const links = extractCanvasLinks('board.canvas', '{"nodes":[]}');
    expect(links).toHaveLength(0);
  });

  it('ignores non-file/text node types', () => {
    const json = JSON.stringify({
      nodes: [
        { id: 'g1', type: 'group', label: 'My Group' },
        { id: 'l1', type: 'link', url: 'https://example.com' },
      ],
    });
    const links = extractCanvasLinks('board.canvas', json);
    expect(links).toHaveLength(0);
  });
});
