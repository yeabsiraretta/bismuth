import { describe, expect, it } from 'vitest';

import {
  computeProgressBar,
  computeTimeProgress,
  daysBetween,
  findProgressBarBlocks,
  parseProgressBarYaml,
  resolveNameTemplate,
} from '@/hubs/editor/services/progressbar-parser';

describe('parseProgressBarYaml', () => {
  it('parses basic config', () => {
    const raw = 'kind: day-year\nname: This Year\nwidth: 80%';
    const config = parseProgressBarYaml(raw);
    expect(config.kind).toBe('day-year');
    expect(config.name).toBe('This Year');
    expect(config.width).toBe('80%');
  });

  it('parses manual values', () => {
    const raw = 'kind: manual\nvalue: 42\nmax: 100\nbutton: true\nid: reading';
    const config = parseProgressBarYaml(raw);
    expect(config.kind).toBe('manual');
    expect(config.value).toBe(42);
    expect(config.max).toBe(100);
    expect(config.button).toBe(true);
    expect(config.id).toBe('reading');
  });

  it('skips comments and empty lines', () => {
    const raw = '# comment\nkind: month\n\nname: test';
    const config = parseProgressBarYaml(raw);
    expect(config.kind).toBe('month');
    expect(config.name).toBe('test');
  });

  it('strips quotes from values', () => {
    const raw = 'name: "My Bar"';
    const config = parseProgressBarYaml(raw);
    expect(config.name).toBe('My Bar');
  });

  it('parses date strings for min/max', () => {
    const raw = 'kind: day-custom\nmin: 2026-01-01\nmax: 2026-12-31';
    const config = parseProgressBarYaml(raw);
    expect(config.min).toBe('2026-01-01');
    expect(config.max).toBe('2026-12-31');
  });
});

describe('daysBetween', () => {
  it('calculates correctly', () => {
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 10))).toBe(9);
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(0);
  });
});

describe('computeTimeProgress', () => {
  it('computes day-of-month', () => {
    const now = new Date(2026, 6, 15); // Jul 15
    const result = computeTimeProgress('day-month', null, null, now);
    expect(result.value).toBe(15);
    expect(result.max).toBe(31);
  });

  it('computes day-of-week', () => {
    const now = new Date(2026, 6, 6); // Monday
    const result = computeTimeProgress('day-week', null, null, now);
    expect(result.value).toBe(1);
    expect(result.max).toBe(7);
  });

  it('computes month', () => {
    const now = new Date(2026, 6, 1);
    const result = computeTimeProgress('month', null, null, now);
    expect(result.value).toBe(7);
    expect(result.max).toBe(12);
  });
});

describe('resolveNameTemplate', () => {
  it('replaces all placeholders', () => {
    const result = resolveNameTemplate('{value}/{max} ({percentage})', {
      value: 42,
      min: 0,
      max: 100,
      percentage: 42,
    });
    expect(result).toBe('42/100 (42%)');
  });
});

describe('computeProgressBar', () => {
  it('computes manual bar', () => {
    const config = parseProgressBarYaml('kind: manual\nvalue: 30\nmax: 60');
    const data = computeProgressBar(config);
    expect(data.value).toBe(30);
    expect(data.max).toBe(60);
    expect(data.percentage).toBe(50);
  });

  it('defaults to 0-100 range', () => {
    const config = parseProgressBarYaml('value: 75');
    const data = computeProgressBar(config);
    expect(data.value).toBe(75);
    expect(data.max).toBe(100);
    expect(data.percentage).toBe(75);
  });
});

describe('findProgressBarBlocks', () => {
  it('finds blocks in document', () => {
    const doc = 'Some text\n\n```progressbar\nkind: month\nname: Months\n```\n\nMore text';
    const blocks = findProgressBarBlocks(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].config.kind).toBe('month');
    expect(blocks[0].data.label).toContain('Months');
  });

  it('finds multiple blocks', () => {
    const doc = '```progressbar\nkind: month\n```\n\n```progressbar\nkind: day-week\n```';
    const blocks = findProgressBarBlocks(doc);
    expect(blocks).toHaveLength(2);
  });

  it('returns empty for no blocks', () => {
    expect(findProgressBarBlocks('plain text')).toEqual([]);
  });
});
