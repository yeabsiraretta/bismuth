import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptyStoryCircle, isStoryCircleComplete, getStoryCircleProgress,
  createEmptyKishotenketsu, createEmptyConflict,
  createTask, toggleTask, deleteTask, getTasksForElement,
  getOpenTasksForCampaign, assignTaskToElement,
  createCustomAttribute, deleteCustomAttribute, getCustomAttributesForType,
  getAllCustomAttributes,
} from '../services/narrativeService';

beforeEach(() => {
  localStorage.clear();
});

describe('Story Circle', () => {
  it('creates 8 empty stages', () => {
    const circle = createEmptyStoryCircle();
    expect(circle).toHaveLength(8);
    expect(circle[0].stage).toBe('you');
    expect(circle[7].stage).toBe('change');
  });

  it('reports incomplete when empty', () => {
    expect(isStoryCircleComplete(createEmptyStoryCircle())).toBe(false);
  });

  it('reports complete when all filled', () => {
    const circle = createEmptyStoryCircle().map((e) => ({ ...e, description: 'filled' }));
    expect(isStoryCircleComplete(circle)).toBe(true);
  });

  it('calculates progress', () => {
    const circle = createEmptyStoryCircle();
    expect(getStoryCircleProgress(circle)).toBe(0);
    circle[0].description = 'done';
    circle[1].description = 'done';
    expect(getStoryCircleProgress(circle)).toBe(25);
  });
});

describe('Kishotenketsu', () => {
  it('creates empty entry', () => {
    const k = createEmptyKishotenketsu();
    expect(k.ki).toBe('');
    expect(k.ten).toBe('');
  });
});

describe('Conflict', () => {
  it('creates empty entry', () => {
    const c = createEmptyConflict();
    expect(c.description).toBe('');
    expect(c.stakes).toBe('');
  });
});

describe('Tasks', () => {
  it('creates and retrieves tasks', () => {
    const t = createTask('el1', 'Discover the secret');
    expect(t.id).toMatch(/^rpg-task_/);
    expect(t.completed).toBe(false);
    expect(getTasksForElement('el1')).toHaveLength(1);
  });

  it('toggles task completion', () => {
    const t = createTask('el1', 'Task');
    toggleTask(t.id);
    expect(getTasksForElement('el1')[0].completed).toBe(true);
    toggleTask(t.id);
    expect(getTasksForElement('el1')[0].completed).toBe(false);
  });

  it('deletes a task', () => {
    const t = createTask('el1', 'Task');
    deleteTask(t.id);
    expect(getTasksForElement('el1')).toHaveLength(0);
  });

  it('assigns task to additional elements', () => {
    const t = createTask('el1', 'Shared task');
    assignTaskToElement(t.id, 'el2');
    expect(getTasksForElement('el2')).toHaveLength(1);
  });

  it('gets open tasks for campaign elements', () => {
    createTask('el1', 'Open1');
    createTask('el1', 'Open2');
    const t3 = createTask('el1', 'Done');
    toggleTask(t3.id);
    createTask('el2', 'Other campaign');
    expect(getOpenTasksForCampaign(['el1'])).toHaveLength(2);
  });
});

describe('Custom Attributes', () => {
  it('creates and retrieves custom attributes', () => {
    createCustomAttribute('Mana Points', 'number', ['npc', 'pc']);
    const attrs = getCustomAttributesForType('npc');
    expect(attrs).toHaveLength(1);
    expect(attrs[0].name).toBe('Mana Points');
  });

  it('filters by element type', () => {
    createCustomAttribute('Weather', 'text', ['scene']);
    createCustomAttribute('HP', 'number', ['npc']);
    expect(getCustomAttributesForType('scene')).toHaveLength(1);
    expect(getCustomAttributesForType('npc')).toHaveLength(1);
    expect(getCustomAttributesForType('location')).toHaveLength(0);
  });

  it('supports option type', () => {
    const attr = createCustomAttribute('Alignment', 'option', ['npc'], ['Good', 'Neutral', 'Evil']);
    expect(attr.options).toEqual(['Good', 'Neutral', 'Evil']);
  });

  it('deletes custom attributes', () => {
    const attr = createCustomAttribute('Temp', 'text', ['event']);
    deleteCustomAttribute(attr.id);
    expect(getAllCustomAttributes()).toHaveLength(0);
  });
});
