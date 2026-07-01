import { describe, it, expect } from 'vitest';
import {
  parseProgressBarYaml, computeTimeProgress, daysBetween,
  resolveNameTemplate, defaultNameForKind, computeProgressBar,
  findProgressBarBlocks, sampleProgressBarBlock,
} from '../services/progressbarParser';
import type { ProgressBarConfig } from '../types/progressbar';

describe('parseProgressBarYaml', () => {
  it('parses kind and name', () => {
    const config = parseProgressBarYaml('kind: day-year\nname: This Year');
    expect(config.kind).toBe('day-year');
    expect(config.name).toBe('This Year');
  });

  it('parses manual value and max', () => {
    const config = parseProgressBarYaml('kind: manual\nvalue: 42\nmax: 100');
    expect(config.kind).toBe('manual');
    expect(config.value).toBe(42);
    expect(config.max).toBe(100);
  });

  it('parses width', () => {
    const config = parseProgressBarYaml('width: 50%');
    expect(config.width).toBe('50%');
  });

  it('parses button and id', () => {
    const config = parseProgressBarYaml('button: true\nid: homework');
    expect(config.button).toBe(true);
    expect(config.id).toBe('homework');
  });

  it('parses day-custom with date min/max', () => {
    const config = parseProgressBarYaml('kind: day-custom\nmin: 2024-02-01\nmax: 2024-04-30');
    expect(config.kind).toBe('day-custom');
    expect(config.min).toBe('2024-02-01');
    expect(config.max).toBe('2024-04-30');
  });

  it('ignores comments', () => {
    const config = parseProgressBarYaml('# comment\nkind: month\n# another');
    expect(config.kind).toBe('month');
  });

  it('handles quoted name with templates', () => {
    const config = parseProgressBarYaml('name: "{percentage} from {min} to {max}"');
    expect(config.name).toBe('{percentage} from {min} to {max}');
  });

  it('returns defaults for empty input', () => {
    const config = parseProgressBarYaml('');
    expect(config.kind).toBeNull();
    expect(config.value).toBeNull();
    expect(config.width).toBe('100%');
  });
});

describe('daysBetween', () => {
  it('calculates days between dates', () => {
    const a = new Date('2024-01-01');
    const b = new Date('2024-01-31');
    expect(daysBetween(a, b)).toBe(30);
  });

  it('returns 0 for same date', () => {
    const d = new Date('2024-06-15');
    expect(daysBetween(d, d)).toBe(0);
  });

  it('handles negative (b before a)', () => {
    const a = new Date('2024-01-31');
    const b = new Date('2024-01-01');
    expect(daysBetween(a, b)).toBe(-30);
  });
});

describe('computeTimeProgress', () => {
  it('computes day-year', () => {
    const now = new Date('2024-07-01');
    const result = computeTimeProgress('day-year', null, null, now);
    expect(result.max).toBe(366); // 2024 is leap year
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThanOrEqual(result.max);
  });

  it('computes day-month', () => {
    const now = new Date(2024, 0, 15); // Jan 15, local time
    const result = computeTimeProgress('day-month', null, null, now);
    expect(result.value).toBe(15);
    expect(result.max).toBe(31);
  });

  it('computes day-week', () => {
    const monday = new Date(2024, 0, 1); // Jan 1 2024, Monday local
    const result = computeTimeProgress('day-week', null, null, monday);
    expect(result.value).toBe(monday.getDay() === 0 ? 7 : monday.getDay());
    expect(result.max).toBe(7);
  });

  it('computes month', () => {
    const now = new Date('2024-06-15');
    const result = computeTimeProgress('month', null, null, now);
    expect(result.value).toBe(6);
    expect(result.max).toBe(12);
  });

  it('computes day-custom', () => {
    const now = new Date('2024-03-15');
    const result = computeTimeProgress('day-custom', '2024-02-01', '2024-04-30', now);
    expect(result.value).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThan(0);
    expect(result.value).toBeLessThanOrEqual(result.max);
  });

  it('handles invalid day-custom dates', () => {
    const result = computeTimeProgress('day-custom', 'invalid', 'invalid');
    expect(result.value).toBe(0);
    expect(result.max).toBe(1);
  });
});

describe('resolveNameTemplate', () => {
  it('resolves all template variables', () => {
    const result = resolveNameTemplate('{value}/{max} ({percentage})', {
      value: 42, min: 0, max: 100, percentage: 42,
    });
    expect(result).toBe('42/100 (42%)');
  });

  it('resolves min template', () => {
    const result = resolveNameTemplate('from {min} to {max}', {
      value: 5, min: 0, max: 10, percentage: 50,
    });
    expect(result).toBe('from 0 to 10');
  });

  it('leaves unknown templates untouched', () => {
    const result = resolveNameTemplate('{unknown} {value}', {
      value: 5, min: 0, max: 10, percentage: 50,
    });
    expect(result).toBe('{unknown} 5');
  });
});

describe('defaultNameForKind', () => {
  it('returns appropriate names', () => {
    expect(defaultNameForKind('day-year')).toContain('Year');
    expect(defaultNameForKind('day-month')).toContain('Month');
    expect(defaultNameForKind('day-week')).toContain('Week');
    expect(defaultNameForKind('month')).toContain('Month');
    expect(defaultNameForKind('manual')).toContain('Progress');
    expect(defaultNameForKind(null)).toContain('Progress');
  });
});

describe('computeProgressBar', () => {
  it('computes manual progress bar', () => {
    const config: ProgressBarConfig = {
      kind: 'manual', name: '{value}/{max}', width: '100%',
      value: 42, min: null, max: 100, button: false, id: null,
    };
    const data = computeProgressBar(config);
    expect(data.value).toBe(42);
    expect(data.max).toBe(100);
    expect(data.percentage).toBe(42);
    expect(data.label).toBe('42/100');
  });

  it('clamps value to min/max', () => {
    const config: ProgressBarConfig = {
      kind: 'manual', name: '', width: '100%',
      value: 150, min: null, max: 100, button: false, id: null,
    };
    const data = computeProgressBar(config);
    expect(data.value).toBe(100);
    expect(data.percentage).toBe(100);
  });

  it('computes time-based bar', () => {
    const config: ProgressBarConfig = {
      kind: 'day-year', name: '', width: '100%',
      value: null, min: null, max: null, button: false, id: null,
    };
    const data = computeProgressBar(config);
    expect(data.value).toBeGreaterThan(0);
    expect(data.max).toBeGreaterThan(300);
  });

  it('enables buttons only for manual bars', () => {
    const manual: ProgressBarConfig = {
      kind: 'manual', name: '', width: '100%',
      value: 5, min: null, max: 10, button: true, id: 'test',
    };
    expect(computeProgressBar(manual).showButtons).toBe(true);

    const timeBased: ProgressBarConfig = {
      kind: 'day-year', name: '', width: '100%',
      value: null, min: null, max: null, button: true, id: null,
    };
    expect(computeProgressBar(timeBased).showButtons).toBe(false);
  });

  it('uses default name when none provided', () => {
    const config: ProgressBarConfig = {
      kind: 'day-year', name: '', width: '100%',
      value: null, min: null, max: null, button: false, id: null,
    };
    const data = computeProgressBar(config);
    expect(data.label).toContain('Year');
    expect(data.label).toContain('%');
  });
});

describe('findProgressBarBlocks', () => {
  it('finds single block', () => {
    const text = 'Some text\n```progressbar\nkind: day-year\nname: Test\n```\nMore text';
    const blocks = findProgressBarBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].config.kind).toBe('day-year');
    expect(blocks[0].config.name).toBe('Test');
  });

  it('finds multiple blocks', () => {
    const text = '```progressbar\nkind: day-year\n```\n\n```progressbar\nkind: month\n```';
    const blocks = findProgressBarBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].config.kind).toBe('day-year');
    expect(blocks[1].config.kind).toBe('month');
  });

  it('returns empty for no blocks', () => {
    expect(findProgressBarBlocks('Just regular markdown')).toHaveLength(0);
  });

  it('returns correct offsets', () => {
    const text = '```progressbar\nkind: manual\nvalue: 5\nmax: 10\n```';
    const blocks = findProgressBarBlocks(text);
    expect(blocks[0].from).toBe(0);
    expect(blocks[0].to).toBe(text.length);
  });

  it('computes data for each block', () => {
    const text = '```progressbar\nkind: manual\nvalue: 7\nmax: 10\n```';
    const blocks = findProgressBarBlocks(text);
    expect(blocks[0].data.value).toBe(7);
    expect(blocks[0].data.max).toBe(10);
    expect(blocks[0].data.percentage).toBe(70);
  });
});

describe('sampleProgressBarBlock', () => {
  it('generates valid blocks', () => {
    const sample = sampleProgressBarBlock();
    expect(sample).toContain('```progressbar');
    expect(sample).toContain('day-year');
    expect(sample).toContain('manual');
    const blocks = findProgressBarBlocks(sample);
    expect(blocks.length).toBeGreaterThanOrEqual(3);
  });
});
