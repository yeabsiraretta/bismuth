import { describe, expect, it } from 'vitest';

import { isMermaidBlock, nextMermaidId } from '@/hubs/editor/services/mermaid-service';

describe('mermaid-service', () => {
  describe('isMermaidBlock', () => {
    it('returns true for "mermaid"', () => {
      expect(isMermaidBlock('mermaid')).toBe(true);
    });

    it('returns true for "Mermaid" (case-insensitive)', () => {
      expect(isMermaidBlock('Mermaid')).toBe(true);
    });

    it('returns true for " mermaid " (with whitespace)', () => {
      expect(isMermaidBlock(' mermaid ')).toBe(true);
    });

    it('returns false for "javascript"', () => {
      expect(isMermaidBlock('javascript')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isMermaidBlock('')).toBe(false);
    });

    it('returns false for "mermaid-js"', () => {
      expect(isMermaidBlock('mermaid-js')).toBe(false);
    });
  });

  describe('nextMermaidId', () => {
    it('returns unique IDs', () => {
      const id1 = nextMermaidId();
      const id2 = nextMermaidId();
      expect(id1).not.toBe(id2);
    });

    it('starts with "mermaid-" prefix', () => {
      const id = nextMermaidId();
      expect(id.startsWith('mermaid-')).toBe(true);
    });
  });
});
