import { describe, expect, it } from 'vitest';

import {
  addTask,
  allTasksDone,
  computeStreak,
  generateHabitContent,
  habitFileName,
  habitFilePath,
  isHabitFile,
  logCompletion,
  noTasksDone,
  parseHabitFile,
  removeTask,
  renameHabit,
  resetAllTasks,
  setAllTasks,
  setRepeatable,
  taskProgress,
  toggleTask,
} from '@/hubs/planner/services/habit-service';

// ── Sample habit file ────────────────────────────────────────────

const SAMPLE_HABIT = `---
type: habit
frequency: daily
repeatable: false
created: 2025-07-01
tags: [health, morning]
---

# Morning Routine

Start each day with these activities.

## Tasks

- [ ] Meditate for 10 minutes
- [x] Exercise for 30 minutes
- [ ] Read for 20 minutes

## Log

- [x] 2025-07-06
- [x] 2025-07-05
- [ ] 2025-07-04
`;

// ── isHabitFile ──────────────────────────────────────────────────

describe('isHabitFile', () => {
  it('returns true for habit frontmatter', () => {
    expect(isHabitFile(SAMPLE_HABIT)).toBe(true);
  });

  it('returns false for regular note', () => {
    expect(isHabitFile('# Just a note\n\nSome text.')).toBe(false);
  });

  it('returns false for other frontmatter types', () => {
    expect(isHabitFile('---\ntype: note\n---\n# Note')).toBe(false);
  });
});

// ── parseHabitFile ───────────────────────────────────────────────

describe('parseHabitFile', () => {
  it('parses name from H1', () => {
    const data = parseHabitFile(SAMPLE_HABIT);
    expect(data.name).toBe('Morning Routine');
  });

  it('parses frequency', () => {
    expect(parseHabitFile(SAMPLE_HABIT).frequency).toBe('daily');
  });

  it('parses created date', () => {
    expect(parseHabitFile(SAMPLE_HABIT).created).toBe('2025-07-01');
  });

  it('parses tags', () => {
    expect(parseHabitFile(SAMPLE_HABIT).tags).toEqual(['health', 'morning']);
  });

  it('parses description', () => {
    expect(parseHabitFile(SAMPLE_HABIT).description).toBe('Start each day with these activities.');
  });

  it('parses tasks with done state', () => {
    const tasks = parseHabitFile(SAMPLE_HABIT).tasks;
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toEqual({ title: 'Meditate for 10 minutes', done: false });
    expect(tasks[1]).toEqual({ title: 'Exercise for 30 minutes', done: true });
    expect(tasks[2]).toEqual({ title: 'Read for 20 minutes', done: false });
  });

  it('parses log entries', () => {
    const log = parseHabitFile(SAMPLE_HABIT).log;
    expect(log).toHaveLength(3);
    expect(log[0]).toEqual({ date: '2025-07-06', completed: true });
    expect(log[1]).toEqual({ date: '2025-07-05', completed: true });
    expect(log[2]).toEqual({ date: '2025-07-04', completed: false });
  });

  it('handles empty file gracefully', () => {
    const data = parseHabitFile('---\ntype: habit\n---\n');
    expect(data.name).toBe('Untitled Habit');
    expect(data.tasks).toEqual([]);
    expect(data.log).toEqual([]);
  });

  it('handles missing sections', () => {
    const data = parseHabitFile('---\ntype: habit\nfrequency: weekly\n---\n\n# My Habit');
    expect(data.name).toBe('My Habit');
    expect(data.frequency).toBe('weekly');
    expect(data.tasks).toEqual([]);
  });
});

// ── generateHabitContent ─────────────────────────────────────────

describe('generateHabitContent', () => {
  it('generates valid habit file', () => {
    const content = generateHabitContent({
      name: 'Exercise',
      frequency: 'daily',
      tasks: ['Run', 'Stretch'],
    });
    expect(isHabitFile(content)).toBe(true);
    const data = parseHabitFile(content);
    expect(data.name).toBe('Exercise');
    expect(data.frequency).toBe('daily');
    expect(data.tasks).toHaveLength(2);
    expect(data.tasks[0].title).toBe('Run');
    expect(data.tasks[1].title).toBe('Stretch');
  });

  it('includes tags in frontmatter', () => {
    const content = generateHabitContent({ name: 'X', tags: ['a', 'b'] });
    expect(content).toContain('tags: [a, b]');
  });

  it('round-trips through parse', () => {
    const content = generateHabitContent({
      name: 'Meditation',
      description: 'Daily mindfulness practice.',
      frequency: 'daily',
      tasks: ['Breathe', 'Journal'],
      tags: ['wellness'],
    });
    const data = parseHabitFile(content);
    expect(data.name).toBe('Meditation');
    expect(data.description).toBe('Daily mindfulness practice.');
    expect(data.tasks.map((t) => t.title)).toEqual(['Breathe', 'Journal']);
    expect(data.tags).toEqual(['wellness']);
  });
});

// ── Task mutations ───────────────────────────────────────────────

describe('addTask', () => {
  it('adds a task to the Tasks section', () => {
    const updated = addTask(SAMPLE_HABIT, 'Journal');
    const data = parseHabitFile(updated);
    expect(data.tasks).toHaveLength(4);
    expect(data.tasks[3].title).toBe('Journal');
    expect(data.tasks[3].done).toBe(false);
  });

  it('creates Tasks section if missing', () => {
    const noTasks = '---\ntype: habit\n---\n\n# Simple\n\n## Log\n\n';
    const updated = addTask(noTasks, 'Do thing');
    const data = parseHabitFile(updated);
    expect(data.tasks).toHaveLength(1);
    expect(data.tasks[0].title).toBe('Do thing');
  });
});

describe('removeTask', () => {
  it('removes a task by index', () => {
    const updated = removeTask(SAMPLE_HABIT, 1);
    const data = parseHabitFile(updated);
    expect(data.tasks).toHaveLength(2);
    expect(data.tasks[0].title).toBe('Meditate for 10 minutes');
    expect(data.tasks[1].title).toBe('Read for 20 minutes');
  });

  it('returns unchanged content for out-of-bounds index', () => {
    expect(removeTask(SAMPLE_HABIT, 10)).toBe(SAMPLE_HABIT);
  });
});

describe('toggleTask', () => {
  it('toggles unchecked to checked', () => {
    const updated = toggleTask(SAMPLE_HABIT, 0);
    const data = parseHabitFile(updated);
    expect(data.tasks[0].done).toBe(true);
  });

  it('toggles checked to unchecked', () => {
    const updated = toggleTask(SAMPLE_HABIT, 1);
    const data = parseHabitFile(updated);
    expect(data.tasks[1].done).toBe(false);
  });

  it('returns unchanged for out-of-bounds', () => {
    expect(toggleTask(SAMPLE_HABIT, 99)).toBe(SAMPLE_HABIT);
  });
});

describe('resetAllTasks', () => {
  it('unchecks all tasks', () => {
    const updated = resetAllTasks(SAMPLE_HABIT);
    const data = parseHabitFile(updated);
    expect(data.tasks.every((t) => !t.done)).toBe(true);
  });
});

describe('setAllTasks', () => {
  it('checks all tasks when done=true', () => {
    const updated = setAllTasks(SAMPLE_HABIT, true);
    const data = parseHabitFile(updated);
    expect(data.tasks.every((t) => t.done)).toBe(true);
  });

  it('unchecks all tasks when done=false', () => {
    const allDone = setAllTasks(SAMPLE_HABIT, true);
    const updated = setAllTasks(allDone, false);
    const data = parseHabitFile(updated);
    expect(data.tasks.every((t) => !t.done)).toBe(true);
  });
});

describe('renameHabit', () => {
  it('renames the habit heading', () => {
    const updated = renameHabit(SAMPLE_HABIT, 'Evening Routine');
    const data = parseHabitFile(updated);
    expect(data.name).toBe('Evening Routine');
  });

  it('preserves other content', () => {
    const updated = renameHabit(SAMPLE_HABIT, 'New Name');
    const data = parseHabitFile(updated);
    expect(data.tasks).toHaveLength(3);
    expect(data.frequency).toBe('daily');
  });
});

describe('setRepeatable', () => {
  it('sets repeatable to true', () => {
    const updated = setRepeatable(SAMPLE_HABIT, true);
    const data = parseHabitFile(updated);
    expect(data.repeatable).toBe(true);
  });

  it('sets repeatable to false', () => {
    const withRepeatable = setRepeatable(SAMPLE_HABIT, true);
    const updated = setRepeatable(withRepeatable, false);
    const data = parseHabitFile(updated);
    expect(data.repeatable).toBe(false);
  });

  it('inserts repeatable if missing', () => {
    const noRepeatable =
      '---\ntype: habit\nfrequency: daily\n---\n\n# Test\n\n## Tasks\n\n- [ ] A\n';
    const updated = setRepeatable(noRepeatable, true);
    const data = parseHabitFile(updated);
    expect(data.repeatable).toBe(true);
  });
});

// ── Log mutations ────────────────────────────────────────────────

describe('logCompletion', () => {
  it('adds a new log entry', () => {
    const updated = logCompletion(SAMPLE_HABIT, '2025-07-07', true);
    const data = parseHabitFile(updated);
    const entry = data.log.find((e) => e.date === '2025-07-07');
    expect(entry).toBeDefined();
    expect(entry!.completed).toBe(true);
  });

  it('updates existing log entry', () => {
    const updated = logCompletion(SAMPLE_HABIT, '2025-07-04', true);
    const data = parseHabitFile(updated);
    const entry = data.log.find((e) => e.date === '2025-07-04');
    expect(entry!.completed).toBe(true);
  });

  it('creates Log section if missing', () => {
    const noLog = '---\ntype: habit\n---\n\n# Simple\n\n## Tasks\n\n- [ ] Do\n';
    const updated = logCompletion(noLog, '2025-07-07', true);
    const data = parseHabitFile(updated);
    expect(data.log).toHaveLength(1);
    expect(data.log[0]).toEqual({ date: '2025-07-07', completed: true });
  });
});

// ── Streak computation ───────────────────────────────────────────

describe('computeStreak', () => {
  it('returns 0 for empty log', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 when no completed entries', () => {
    expect(computeStreak([{ date: '2025-07-06', completed: false }])).toBe(0);
  });

  it('counts consecutive completed days', () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        completed: true,
      });
    }
    expect(computeStreak(dates, 'daily')).toBe(5);
  });

  it('streak breaks on missed day', () => {
    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const d1 = new Date(today);
    d1.setDate(d1.getDate() - 1);
    const d3 = new Date(today);
    d3.setDate(d3.getDate() - 3);
    // Skip day -2
    expect(
      computeStreak(
        [
          { date: fmt(today), completed: true },
          { date: fmt(d1), completed: true },
          { date: fmt(d3), completed: true },
        ],
        'daily'
      )
    ).toBe(2);
  });
});

// ── Task helpers ─────────────────────────────────────────────────

describe('allTasksDone', () => {
  it('true when all done', () => {
    expect(
      allTasksDone([
        { title: 'a', done: true },
        { title: 'b', done: true },
      ])
    ).toBe(true);
  });

  it('false when any undone', () => {
    expect(
      allTasksDone([
        { title: 'a', done: true },
        { title: 'b', done: false },
      ])
    ).toBe(false);
  });

  it('false for empty tasks', () => {
    expect(allTasksDone([])).toBe(false);
  });
});

describe('noTasksDone', () => {
  it('true when none done', () => {
    expect(
      noTasksDone([
        { title: 'a', done: false },
        { title: 'b', done: false },
      ])
    ).toBe(true);
  });

  it('false when any done', () => {
    expect(
      noTasksDone([
        { title: 'a', done: true },
        { title: 'b', done: false },
      ])
    ).toBe(false);
  });

  it('false for empty tasks', () => {
    expect(noTasksDone([])).toBe(false);
  });
});

describe('taskProgress', () => {
  it('counts done and total', () => {
    const prog = taskProgress([
      { title: 'a', done: true },
      { title: 'b', done: false },
      { title: 'c', done: true },
    ]);
    expect(prog).toEqual({ done: 2, total: 3 });
  });
});

// ── Path helpers ─────────────────────────────────────────────────

describe('habitFileName', () => {
  it('creates kebab-case filename', () => {
    expect(habitFileName('Morning Routine')).toBe('morning-routine.md');
  });

  it('strips special characters', () => {
    expect(habitFileName("Don't Stop!")).toBe('dont-stop.md');
  });
});

describe('habitFilePath', () => {
  it('returns path in habits folder', () => {
    expect(habitFilePath('My Habit')).toBe('habits/my-habit.md');
  });
});
