import { describe, it, expect } from 'vitest';
import { parseTask, parseProject, generateId } from '../services/projectIO';

describe('generateId', () => {
  it('produces unique IDs', () => {
    const a = generateId();
    const b = generateId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(5);
  });
});

describe('parseTask', () => {
  it('parses minimal frontmatter', () => {
    const fm = { 'pm-task': true, title: 'Ship v1' };
    const task = parseTask(fm, 'Projects/t.md', 'Task body');
    expect(task.title).toBe('Ship v1');
    expect(task.description).toBe('Task body');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.type).toBe('task');
    expect(task.path).toBe('Projects/t.md');
  });

  it('parses full frontmatter', () => {
    const fm = {
      'pm-task': true,
      id: 'abc123',
      title: 'Milestone',
      type: 'milestone',
      status: 'in-progress',
      priority: 'high',
      start: '2026-04-01',
      due: '2026-04-15',
      progress: 60,
      'time-estimate': 20,
      'time-logs': [{ date: '2026-04-02', hours: 3, note: 'setup' }],
      assignees: ['alice', 'bob'],
      tags: ['launch'],
      parent: 'parent-1',
      subtasks: ['sub-1'],
      dependencies: ['dep-1', 'dep-2'],
      recurrence: { interval: 'weekly' },
      'custom-fields': { effort: 5 },
      archived: true,
      created: '2026-03-01',
      updated: '2026-04-10',
    };

    const task = parseTask(fm, 'Projects/m.md', 'Desc');
    expect(task.id).toBe('abc123');
    expect(task.type).toBe('milestone');
    expect(task.status).toBe('in-progress');
    expect(task.priority).toBe('high');
    expect(task.startDate).toBe('2026-04-01');
    expect(task.dueDate).toBe('2026-04-15');
    expect(task.progress).toBe(60);
    expect(task.timeEstimate).toBe(20);
    expect(task.timeLogs).toHaveLength(1);
    expect(task.assignees).toEqual(['alice', 'bob']);
    expect(task.tags).toEqual(['launch']);
    expect(task.parentId).toBe('parent-1');
    expect(task.subtaskIds).toEqual(['sub-1']);
    expect(task.dependencies).toEqual(['dep-1', 'dep-2']);
    expect(task.recurrence).toEqual({ interval: 'weekly' });
    expect(task.customFields).toEqual({ effort: 5 });
    expect(task.archived).toBe(true);
  });

  it('defaults missing fields safely', () => {
    const task = parseTask({}, 'p/t.md', '');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.assignees).toEqual([]);
    expect(task.dependencies).toEqual([]);
    expect(task.timeLogs).toEqual([]);
    expect(task.archived).toBe(false);
  });
});

describe('parseProject', () => {
  it('parses minimal frontmatter', () => {
    const fm = { 'pm-project': true, name: 'Alpha' };
    const project = parseProject(fm, 'Projects/alpha/_project.md', '');
    expect(project.name).toBe('Alpha');
    expect(project.color).toBe('#3b82f6');
    expect(project.icon).toBe('briefcase');
    expect(project.defaultView).toBe('table');
  });

  it('parses full frontmatter', () => {
    const fm = {
      'pm-project': true,
      id: 'proj-1',
      name: 'Beta',
      description: 'Beta project',
      color: '#ef4444',
      icon: 'star',
      folder: 'Projects/Beta',
      'default-view': 'kanban',
      'custom-fields': [{ id: 'f1', name: 'Effort', type: 'number' }],
      'team-members': ['alice'],
      created: '2026-01-01',
      updated: '2026-06-01',
    };

    const project = parseProject(fm, 'p/proj.md', 'Project body');
    expect(project.id).toBe('proj-1');
    expect(project.name).toBe('Beta');
    expect(project.color).toBe('#ef4444');
    expect(project.icon).toBe('star');
    expect(project.defaultView).toBe('kanban');
    expect(project.customFields).toHaveLength(1);
    expect(project.teamMembers).toEqual(['alice']);
    expect(project.description).toBe('Project body');
  });
});
