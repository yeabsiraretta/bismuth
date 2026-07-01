import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  sharedStyles,
  createStyle,
  applyStyle,
  updateStyle,
  getLinkedElements,
  detachStyle,
  deleteStyle,
} from '../design/styleLibrary';

describe('styleLibrary', () => {
  beforeEach(() => {
    sharedStyles.set([]);
  });

  describe('createStyle', () => {
    it('should create a new shared style', () => {
      const style = createStyle('Primary Fill', 'fill', { color: '#4A90D9' });
      expect(style.id).toBeDefined();
      expect(style.name).toBe('Primary Fill');
      expect(style.type).toBe('fill');
      expect(get(sharedStyles)).toHaveLength(1);
    });

    it('should assign unique IDs', () => {
      const s1 = createStyle('A', 'fill', {});
      const s2 = createStyle('B', 'stroke', {});
      expect(s1.id).not.toBe(s2.id);
    });
  });

  describe('applyStyle / detachStyle', () => {
    it('should link an element to a style', () => {
      const style = createStyle('Test', 'fill', {});
      applyStyle('el-1', style.id);
      const linked = getLinkedElements(style.id);
      expect(linked).toContain('el-1');
    });

    it('should not duplicate element links', () => {
      const style = createStyle('Test', 'fill', {});
      applyStyle('el-1', style.id);
      applyStyle('el-1', style.id);
      const linked = getLinkedElements(style.id);
      expect(linked.filter(id => id === 'el-1')).toHaveLength(1);
    });

    it('should detach an element from a style', () => {
      const style = createStyle('Test', 'fill', {});
      applyStyle('el-1', style.id);
      detachStyle('el-1', style.id);
      const linked = getLinkedElements(style.id);
      expect(linked).not.toContain('el-1');
    });
  });

  describe('updateStyle', () => {
    it('should update style properties', () => {
      const style = createStyle('Test', 'fill', { color: '#000' });
      updateStyle(style.id, { color: '#FFF' });
      const updated = get(sharedStyles).find(s => s.id === style.id);
      expect(updated?.properties['color']).toBe('#FFF');
    });

    it('should update the updatedAt timestamp', () => {
      const style = createStyle('Test', 'fill', {});
      updateStyle(style.id, { color: '#123' });
      const updated = get(sharedStyles).find(s => s.id === style.id);
      expect(updated?.updatedAt).toBeDefined();
      expect(updated?.updatedAt).not.toBe('');
    });
  });

  describe('deleteStyle', () => {
    it('should remove a style', () => {
      const style = createStyle('Test', 'fill', {});
      deleteStyle(style.id);
      expect(get(sharedStyles)).toHaveLength(0);
    });

    it('should not affect other styles', () => {
      const s1 = createStyle('A', 'fill', {});
      const s2 = createStyle('B', 'stroke', {});
      deleteStyle(s1.id);
      expect(get(sharedStyles)).toHaveLength(1);
      expect(get(sharedStyles)[0].id).toBe(s2.id);
    });
  });
});
