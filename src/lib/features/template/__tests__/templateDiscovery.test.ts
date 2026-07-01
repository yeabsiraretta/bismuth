import { describe, it, expect } from 'vitest';
import {
  isSmartTemplate,
  extractSmartTemplateContent,
  extractDescription,
  filterTemplates,
  groupBySource,
  SOURCE_LABELS,
} from '../services/templateDiscovery';
import type { SmartTemplate } from '../types/smartTemplate';

const sampleTemplates: SmartTemplate[] = [
  { name: 'Summary', content: 'Summarize', source: 'builtin', description: 'Quick summary' },
  { name: 'Tags', content: 'Add tags', source: 'builtin', description: 'Tag helper' },
  { name: 'Meeting', content: 'Meeting template', source: 'folder', description: 'For meetings' },
  { name: 'Research', content: 'Research template', source: 'tagged' },
];

describe('isSmartTemplate', () => {
  it('detects smart_template: true in frontmatter', () => {
    const content = '---\ntitle: My Template\nsmart_template: true\n---\nContent here';
    expect(isSmartTemplate(content)).toBe(true);
  });

  it('returns false without the flag', () => {
    const content = '---\ntitle: Normal Note\n---\nContent here';
    expect(isSmartTemplate(content)).toBe(false);
  });

  it('returns false without frontmatter', () => {
    expect(isSmartTemplate('Just content')).toBe(false);
  });

  it('is case-insensitive', () => {
    const content = '---\nSmart_Template: True\n---\nContent';
    expect(isSmartTemplate(content)).toBe(true);
  });
});

describe('extractSmartTemplateContent', () => {
  it('extracts content after frontmatter', () => {
    const content = '---\ntitle: Test\n---\n\n# Template Body\n\nInstructions here.';
    expect(extractSmartTemplateContent(content)).toBe('# Template Body\n\nInstructions here.');
  });

  it('returns full content if no frontmatter', () => {
    expect(extractSmartTemplateContent('Just content')).toBe('Just content');
  });
});

describe('extractDescription', () => {
  it('extracts description from frontmatter', () => {
    const content = '---\ntitle: Test\ndescription: My description here\n---\n';
    expect(extractDescription(content)).toBe('My description here');
  });

  it('handles quoted description', () => {
    const content = '---\ndescription: "Quoted desc"\n---\n';
    expect(extractDescription(content)).toBe('Quoted desc');
  });

  it('returns undefined if no description', () => {
    const content = '---\ntitle: Test\n---\n';
    expect(extractDescription(content)).toBeUndefined();
  });
});

describe('filterTemplates', () => {
  it('returns all when query is empty', () => {
    expect(filterTemplates(sampleTemplates, '')).toEqual(sampleTemplates);
  });

  it('filters by name', () => {
    const result = filterTemplates(sampleTemplates, 'meet');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Meeting');
  });

  it('filters by description', () => {
    const result = filterTemplates(sampleTemplates, 'helper');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tags');
  });

  it('is case-insensitive', () => {
    const result = filterTemplates(sampleTemplates, 'SUMMARY');
    expect(result).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    expect(filterTemplates(sampleTemplates, 'zzz')).toEqual([]);
  });
});

describe('groupBySource', () => {
  it('groups templates by source', () => {
    const groups = groupBySource(sampleTemplates);
    expect(groups['builtin']).toHaveLength(2);
    expect(groups['folder']).toHaveLength(1);
    expect(groups['tagged']).toHaveLength(1);
  });
});

describe('SOURCE_LABELS', () => {
  it('has labels for all sources', () => {
    expect(SOURCE_LABELS['builtin']).toBe('Built-in');
    expect(SOURCE_LABELS['folder']).toBe('Vault Templates');
    expect(SOURCE_LABELS['tagged']).toBe('Smart Templates');
    expect(SOURCE_LABELS['vault']).toBe('Obsidian Templates');
  });
});
