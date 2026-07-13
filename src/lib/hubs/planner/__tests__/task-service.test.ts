import { describe, expect, it } from 'vitest';

import {
  checkboxForStatus,
  formatRecurrence,
  formatTaskLine,
  isDueSoon,
  isDueToday,
  isOverdue,
  parseRecurrence,
  parseTaskLine,
  parseTasksFromContent,
} from '@/hubs/planner/services/task-service';

// ── parseTaskLine: basic checkbox ─────────────────────────────────

describe('parseTaskLine', () => {
  it('parses a simple unchecked task', () => {
    const result = parseTaskLine('- [ ] Buy milk', 1);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Buy milk');
    expect(result!.status).toBe('todo');
    expect(result!.line).toBe(1);
    expect(result!.indentLevel).toBe(0);
  });

  it('parses a checked task', () => {
    const result = parseTaskLine('- [x] Done task', 2);
    expect(result!.status).toBe('done');
  });

  it('parses cancelled status (-)', () => {
    const result = parseTaskLine('- [-] Cancelled task', 3);
    expect(result!.status).toBe('cancelled');
  });

  it('parses in-progress status (/)', () => {
    const result = parseTaskLine('- [/] Working on it', 4);
    expect(result!.status).toBe('in-progress');
  });

  it('parses blocked status (!)', () => {
    const result = parseTaskLine('- [!] Blocked task', 5);
    expect(result!.status).toBe('blocked');
  });

  it('parses in-review status (>)', () => {
    const result = parseTaskLine('- [>] Review needed', 6);
    expect(result!.status).toBe('in-review');
  });

  it('returns null for non-task lines', () => {
    expect(parseTaskLine('Just a paragraph', 1)).toBeNull();
    expect(parseTaskLine('- Regular list item', 1)).toBeNull();
    expect(parseTaskLine('## Heading', 1)).toBeNull();
    expect(parseTaskLine('', 1)).toBeNull();
  });

  it('detects indent level', () => {
    const result = parseTaskLine('    - [ ] Nested task', 1);
    expect(result!.indentLevel).toBe(2);
  });

  it('handles * bullet', () => {
    const result = parseTaskLine('* [ ] Star bullet task', 1);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Star bullet task');
  });
});

// ── parseTaskLine: text-based metadata ────────────────────────────

describe('parseTaskLine metadata (text format)', () => {
  it('extracts due date', () => {
    const result = parseTaskLine('- [ ] Task [due:: 2025-06-15]', 1);
    expect(result!.dueDate).toBe('2025-06-15');
    expect(result!.title).toBe('Task');
  });

  it('extracts scheduled date', () => {
    const result = parseTaskLine('- [ ] Task [scheduled:: 2025-06-20]', 1);
    expect(result!.scheduledDate).toBe('2025-06-20');
  });

  it('extracts done date', () => {
    const result = parseTaskLine('- [x] Task [done:: 2025-06-14]', 1);
    expect(result!.doneDate).toBe('2025-06-14');
  });

  it('extracts start date', () => {
    const result = parseTaskLine('- [ ] Task [start:: 2025-06-01]', 1);
    expect(result!.startDate).toBe('2025-06-01');
  });

  it('extracts priority', () => {
    const result = parseTaskLine('- [ ] Task [priority:: high]', 1);
    expect(result!.priority).toBe('high');
  });

  it('extracts critical priority', () => {
    const result = parseTaskLine('- [ ] Task [priority:: critical]', 1);
    expect(result!.priority).toBe('critical');
  });

  it('extracts tags', () => {
    const result = parseTaskLine('- [ ] Task #work #urgent', 1);
    expect(result!.tags).toEqual(['work', 'urgent']);
  });

  it('extracts recurrence', () => {
    const result = parseTaskLine('- [ ] Task [repeat:: every week]', 1);
    expect(result!.recurrence).not.toBeNull();
    expect(result!.recurrence!.frequency).toBe('weekly');
    expect(result!.recurrence!.interval).toBe(1);
  });

  it('extracts multiple metadata fields', () => {
    const result = parseTaskLine(
      '- [ ] Meeting [due:: 2025-07-01] [priority:: high] #work [repeat:: daily]',
      1
    );
    expect(result!.title).toBe('Meeting #work');
    expect(result!.dueDate).toBe('2025-07-01');
    expect(result!.priority).toBe('high');
    expect(result!.tags).toEqual(['work']);
    expect(result!.recurrence!.frequency).toBe('daily');
  });

  it('strips metadata from title', () => {
    const result = parseTaskLine('- [ ] Clean house [due:: 2025-06-15] [priority:: low]', 1);
    expect(result!.title).toBe('Clean house');
  });
});

// ── parseRecurrence ───────────────────────────────────────────────

describe('parseRecurrence', () => {
  it('parses "daily"', () => {
    const r = parseRecurrence('daily');
    expect(r).toEqual({ frequency: 'daily', interval: 1 });
  });

  it('parses "every day"', () => {
    expect(parseRecurrence('every day')).toEqual({ frequency: 'daily', interval: 1 });
  });

  it('parses "weekly"', () => {
    expect(parseRecurrence('weekly')).toEqual({ frequency: 'weekly', interval: 1 });
  });

  it('parses "every week"', () => {
    expect(parseRecurrence('every week')).toEqual({ frequency: 'weekly', interval: 1 });
  });

  it('parses "monthly"', () => {
    expect(parseRecurrence('monthly')).toEqual({ frequency: 'monthly', interval: 1 });
  });

  it('parses "yearly"', () => {
    expect(parseRecurrence('yearly')).toEqual({ frequency: 'yearly', interval: 1 });
  });

  it('parses "every 2 weeks"', () => {
    const r = parseRecurrence('every 2 weeks');
    expect(r).not.toBeNull();
    expect(r!.interval).toBe(2);
  });

  it('parses "every 3 months"', () => {
    const r = parseRecurrence('every 3 months');
    expect(r).not.toBeNull();
    expect(r!.interval).toBe(3);
  });

  it('returns null for unknown patterns', () => {
    expect(parseRecurrence('sometimes')).toBeNull();
    expect(parseRecurrence('every other tuesday')).toBeNull();
  });
});

// ── parseTasksFromContent ─────────────────────────────────────────

describe('parseTasksFromContent', () => {
  it('extracts all tasks from markdown', () => {
    const content = `# Project
- [ ] Task one [due:: 2025-06-15]
- [x] Task two [done:: 2025-06-14]
Some text
- [ ] Task three #important
`;
    const tasks = parseTasksFromContent(content);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].title).toBe('Task one');
    expect(tasks[0].dueDate).toBe('2025-06-15');
    expect(tasks[1].status).toBe('done');
    expect(tasks[2].tags).toEqual(['important']);
  });

  it('returns empty array for content with no tasks', () => {
    const tasks = parseTasksFromContent('# Just a heading\nSome text\n');
    expect(tasks).toEqual([]);
  });

  it('preserves line numbers', () => {
    const content = 'Line 1\n- [ ] On line 2\nLine 3\n- [x] On line 4';
    const tasks = parseTasksFromContent(content);
    expect(tasks[0].line).toBe(2);
    expect(tasks[1].line).toBe(4);
  });
});

// ── checkboxForStatus ─────────────────────────────────────────────

describe('checkboxForStatus', () => {
  it('returns space for todo', () => expect(checkboxForStatus('todo')).toBe(' '));
  it('returns x for done', () => expect(checkboxForStatus('done')).toBe('x'));
  it('returns - for cancelled', () => expect(checkboxForStatus('cancelled')).toBe('-'));
  it('returns / for in-progress', () => expect(checkboxForStatus('in-progress')).toBe('/'));
  it('returns > for in-review', () => expect(checkboxForStatus('in-review')).toBe('>'));
  it('returns ! for blocked', () => expect(checkboxForStatus('blocked')).toBe('!'));
});

// ── formatTaskLine ────────────────────────────────────────────────

describe('formatTaskLine', () => {
  it('formats a basic task', () => {
    const line = formatTaskLine('Buy milk', 'todo');
    expect(line).toBe('- [ ] Buy milk');
  });

  it('formats a done task', () => {
    expect(formatTaskLine('Done', 'done')).toBe('- [x] Done');
  });

  it('includes due date in text format', () => {
    const line = formatTaskLine('Task', 'todo', { dueDate: '2025-06-15' });
    expect(line).toContain('[due:: 2025-06-15]');
  });

  it('includes priority when not medium', () => {
    const line = formatTaskLine('Task', 'todo', { priority: 'high' });
    expect(line).toContain('[priority:: high]');
  });

  it('omits priority when medium (default)', () => {
    const line = formatTaskLine('Task', 'todo', { priority: 'medium' });
    expect(line).not.toContain('priority');
  });

  it('includes recurrence', () => {
    const line = formatTaskLine('Task', 'todo', {
      recurrence: { frequency: 'weekly', interval: 1 },
    });
    expect(line).toContain('[repeat:: every week]');
  });

  it('includes scheduled date', () => {
    const line = formatTaskLine('Task', 'todo', { scheduledDate: '2025-06-20' });
    expect(line).toContain('[scheduled:: 2025-06-20]');
  });

  it('includes done date', () => {
    const line = formatTaskLine('Task', 'done', { doneDate: '2025-06-14' });
    expect(line).toContain('[done:: 2025-06-14]');
  });

  it('does not duplicate existing tags in title', () => {
    const line = formatTaskLine('Task #work', 'todo', { tags: ['work', 'urgent'] });
    expect(line).toBe('- [ ] Task #work #urgent');
  });
});

// ── formatRecurrence ──────────────────────────────────────────────

describe('formatRecurrence', () => {
  it('formats daily', () => {
    expect(formatRecurrence({ frequency: 'daily', interval: 1 })).toBe('every day');
  });

  it('formats every 2 weeks', () => {
    expect(formatRecurrence({ frequency: 'weekly', interval: 2 })).toBe('every 2 weeks');
  });

  it('formats monthly', () => {
    expect(formatRecurrence({ frequency: 'monthly', interval: 1 })).toBe('every month');
  });
});

// ── Due date helpers ──────────────────────────────────────────────

describe('isOverdue', () => {
  it('returns true for past due', () => {
    expect(isOverdue({ dueDate: '2020-01-01', status: 'todo' })).toBe(true);
  });

  it('returns false for done tasks', () => {
    expect(isOverdue({ dueDate: '2020-01-01', status: 'done' })).toBe(false);
  });

  it('returns false with no due date', () => {
    expect(isOverdue({ dueDate: null, status: 'todo' })).toBe(false);
  });
});

describe('isDueToday', () => {
  it('returns true for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isDueToday({ dueDate: today, status: 'todo' })).toBe(true);
  });

  it('returns false for done tasks', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isDueToday({ dueDate: today, status: 'done' })).toBe(false);
  });
});

describe('isDueSoon', () => {
  it('returns true for date within range', () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    expect(isDueSoon({ dueDate: d.toISOString().slice(0, 10), status: 'todo' })).toBe(true);
  });

  it('returns false for today (not strictly in the "soon" window)', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isDueSoon({ dueDate: today, status: 'todo' })).toBe(false);
  });

  it('returns false for done tasks', () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    expect(isDueSoon({ dueDate: d.toISOString().slice(0, 10), status: 'done' })).toBe(false);
  });
});
