import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseIsoDuration,
  formatDateWithMask,
  magicTime,
  splitTags,
  applyRecipeTemplate,
} from '../services/recipeTemplate';
import type { GrabbedRecipeData } from '../types';

describe('parseIsoDuration', () => {
  it('parses hours and minutes', () => {
    expect(parseIsoDuration('PT1H30M')).toBe('1h 30m');
  });

  it('parses minutes only', () => {
    expect(parseIsoDuration('PT15M')).toBe('15m');
  });

  it('parses hours only', () => {
    expect(parseIsoDuration('PT2H')).toBe('2h');
  });

  it('parses days, hours, minutes', () => {
    expect(parseIsoDuration('P1DT2H30M')).toBe('1d 2h 30m');
  });

  it('parses seconds', () => {
    expect(parseIsoDuration('PT45S')).toBe('45s');
  });

  it('returns empty string for empty input', () => {
    expect(parseIsoDuration('')).toBe('');
  });

  it('returns original for non-ISO string', () => {
    expect(parseIsoDuration('about 1 hour')).toBe('about 1 hour');
  });
});

describe('formatDateWithMask', () => {
  it('formats with default mask', () => {
    expect(formatDateWithMask('2024-04-13T20:10:00Z')).toMatch(/2024-04-1[23] \d{2}:\d{2}/);
  });

  it('formats with custom mask', () => {
    const result = formatDateWithMask('2017-07-27T00:14:00Z', 'dd-mm-yyyy HH:MM');
    expect(result).toMatch(/2[67]-07-2017 \d{2}:14/);
  });

  it('returns original for invalid date', () => {
    expect(formatDateWithMask('not-a-date')).toBe('not-a-date');
  });
});

describe('magicTime', () => {
  it('returns current date when no args', () => {
    const result = magicTime();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('parses ISO duration', () => {
    expect(magicTime('PT1H5M')).toBe('1h 5m');
  });

  it('formats date string', () => {
    const result = magicTime('2017-07-27T00:14:00Z');
    expect(result).toMatch(/2017-07-2[67] \d{2}:14/);
  });

  it('formats date with custom mask', () => {
    const result = magicTime('2024-04-13T20:10:00Z', 'dd-mm-yyyy HH:MM');
    expect(result).toMatch(/1[23]-04-2024 \d{2}:10/);
  });
});

describe('splitTags', () => {
  it('splits comma-separated tags into YAML list', () => {
    expect(splitTags('pasta, Italian, easy')).toBe('  - pasta\n  - Italian\n  - easy');
  });

  it('handles single tag', () => {
    expect(splitTags('dessert')).toBe('  - dessert');
  });

  it('returns empty for empty input', () => {
    expect(splitTags('')).toBe('');
  });

  it('trims whitespace from tags', () => {
    expect(splitTags('  a ,  b  , c  ')).toBe('  - a\n  - b\n  - c');
  });

  it('filters empty entries', () => {
    expect(splitTags('a,,b')).toBe('  - a\n  - b');
  });
});

describe('applyRecipeTemplate', () => {
  const sampleData: GrabbedRecipeData = {
    url: 'https://example.com/recipe',
    name: 'Test Pasta',
    description: 'A simple pasta recipe.',
    image: 'https://example.com/img.jpg',
    author: 'Chef Test',
    prepTime: 'PT15M',
    cookTime: 'PT30M',
    totalTime: 'PT45M',
    recipeYield: '4 servings',
    recipeCategory: 'Main Course',
    recipeCuisine: 'Italian',
    keywords: 'pasta, easy, Italian',
    datePublished: '2024-01-15',
    ingredients: ['200g pasta', '2 cloves garlic', '1 tbsp olive oil'],
    instructions: ['Boil pasta.', 'Sauté garlic.', 'Combine and serve.'],
    nutrition: { calories: '350' },
    rawJson: '{"@type":"Recipe"}',
  };

  it('substitutes simple fields', () => {
    const result = applyRecipeTemplate('Name: {{name}}, Author: {{author}}', sampleData);
    expect(result).toBe('Name: Test Pasta, Author: Chef Test');
  });

  it('renders triple-stache for raw JSON', () => {
    const result = applyRecipeTemplate('JSON: {{{rawJson}}}', sampleData);
    expect(result).toBe('JSON: {"@type":"Recipe"}');
  });

  it('renders {{#each}} blocks with {{this}}', () => {
    const tpl = '{{#each ingredients}}\n- {{this}}\n{{/each}}';
    const result = applyRecipeTemplate(tpl, sampleData);
    expect(result).toBe('- 200g pasta\n- 2 cloves garlic\n- 1 tbsp olive oil\n');
  });

  it('renders {{@number}} in each blocks', () => {
    const tpl = '{{#each instructions}}\n{{@number}}. {{this}}\n{{/each}}';
    const result = applyRecipeTemplate(tpl, sampleData);
    expect(result).toContain('1. Boil pasta.');
    expect(result).toContain('3. Combine and serve.');
  });

  it('renders {{@index}} in each blocks', () => {
    const tpl = '{{#each instructions}}\n[{{@index}}] {{this}}\n{{/each}}';
    const result = applyRecipeTemplate(tpl, sampleData);
    expect(result).toContain('[0] Boil pasta.');
    expect(result).toContain('[2] Combine and serve.');
  });

  it('handles magicTime helper for ISO duration', () => {
    const result = applyRecipeTemplate('Prep: {{magicTime prepTime}}', sampleData);
    expect(result).toBe('Prep: 15m');
  });

  it('handles magicTime helper with no args', () => {
    const result = applyRecipeTemplate('Saved: {{magicTime}}', sampleData);
    expect(result).toMatch(/Saved: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  });

  it('handles magicTime helper with custom mask', () => {
    const result = applyRecipeTemplate('Published: {{magicTime datePublished "dd-mm-yyyy"}}', sampleData);
    expect(result).toMatch(/Published: 1[45]-01-2024/);
  });

  it('handles splitTags helper', () => {
    const result = applyRecipeTemplate('tags:\n{{splitTags keywords}}', sampleData);
    expect(result).toContain('  - pasta');
    expect(result).toContain('  - easy');
    expect(result).toContain('  - Italian');
  });

  it('handles missing fields gracefully', () => {
    const result = applyRecipeTemplate('{{nonexistent}}', sampleData);
    expect(result).toBe('');
  });

  it('renders full default-like template', () => {
    const tpl = `# {{name}}
by {{author}}

## Ingredients
{{#each ingredients}}
- {{this}}
{{/each}}

## Instructions
{{#each instructions}}
{{@number}}. {{this}}
{{/each}}`;
    const result = applyRecipeTemplate(tpl, sampleData);
    expect(result).toContain('# Test Pasta');
    expect(result).toContain('by Chef Test');
    expect(result).toContain('- 200g pasta');
    expect(result).toContain('1. Boil pasta.');
  });
});
