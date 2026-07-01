/**
 * Narrative tools service — story circle, kishotenketsu, conflict, and tasks.
 */

import type {
  StoryCircleEntry, StoryCircleStage, KishotenketsuEntry,
  ConflictEntry, RpgTask, CustomAttribute, CustomAttributeType, ElementType,
} from '../types';
import { generatePrefixedId } from '@/utils/id';
import { log } from '@/utils/logger';

// ─── Story Circle ────────────────────────────────────────────────────────────

export const STORY_CIRCLE_STAGES: { stage: StoryCircleStage; label: string; prompt: string }[] = [
  { stage: 'you',    label: 'You',    prompt: 'Establish the protagonist in their comfort zone' },
  { stage: 'need',   label: 'Need',   prompt: 'They want or need something' },
  { stage: 'go',     label: 'Go',     prompt: 'They enter an unfamiliar situation' },
  { stage: 'search', label: 'Search', prompt: 'They adapt to the new situation' },
  { stage: 'find',   label: 'Find',   prompt: 'They get what they wanted' },
  { stage: 'take',   label: 'Take',   prompt: 'They pay a heavy price for it' },
  { stage: 'return', label: 'Return', prompt: 'They return to their familiar situation' },
  { stage: 'change', label: 'Change', prompt: 'They have changed' },
];

export function createEmptyStoryCircle(): StoryCircleEntry[] {
  return STORY_CIRCLE_STAGES.map(({ stage }) => ({ stage, description: '' }));
}

export function isStoryCircleComplete(circle: StoryCircleEntry[]): boolean {
  return circle.every((entry) => entry.description.trim().length > 0);
}

export function getStoryCircleProgress(circle: StoryCircleEntry[]): number {
  const filled = circle.filter((e) => e.description.trim().length > 0).length;
  return Math.round((filled / 8) * 100);
}

// ─── Kishotenketsu ───────────────────────────────────────────────────────────

export function createEmptyKishotenketsu(): KishotenketsuEntry {
  return { ki: '', sho: '', ten: '', ketsu: '' };
}

export const KISHOTENKETSU_LABELS = {
  ki: { label: 'Ki (Introduction)', prompt: 'Introduce the characters and setting' },
  sho: { label: 'Sho (Development)', prompt: 'Develop the story further' },
  ten: { label: 'Ten (Twist)', prompt: 'An unexpected twist or complication' },
  ketsu: { label: 'Ketsu (Conclusion)', prompt: 'Reconcile with the twist and conclude' },
};

// ─── Conflict ────────────────────────────────────────────────────────────────

export function createEmptyConflict(): ConflictEntry {
  return { description: '', stakes: '', resolution: '' };
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

const TASKS_KEY = 'bismuth-rpg-tasks';

function loadTasks(): RpgTask[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTasks(tasks: RpgTask[]): void {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }
  catch { log.warn('Failed to persist RPG tasks'); }
}

export function createTask(elementId: string, description: string): RpgTask {
  const task: RpgTask = {
    id: generatePrefixedId('rpg-task'),
    elementId, description,
    completed: false,
    assignedElements: [elementId],
  };
  const all = loadTasks();
  all.push(task);
  saveTasks(all);
  return task;
}

export function toggleTask(id: string): void {
  const all = loadTasks();
  const task = all.find((t) => t.id === id);
  if (task) { task.completed = !task.completed; saveTasks(all); }
}

export function deleteTask(id: string): void {
  saveTasks(loadTasks().filter((t) => t.id !== id));
}

export function getTasksForElement(elementId: string): RpgTask[] {
  return loadTasks().filter(
    (t) => t.elementId === elementId || t.assignedElements.includes(elementId)
  );
}

export function getOpenTasksForCampaign(campaignElementIds: string[]): RpgTask[] {
  const idSet = new Set(campaignElementIds);
  return loadTasks().filter(
    (t) => !t.completed && (idSet.has(t.elementId) || t.assignedElements.some((a) => idSet.has(a)))
  );
}

export function assignTaskToElement(taskId: string, elementId: string): void {
  const all = loadTasks();
  const task = all.find((t) => t.id === taskId);
  if (task && !task.assignedElements.includes(elementId)) {
    task.assignedElements.push(elementId);
    saveTasks(all);
  }
}

// ─── Custom Attributes ───────────────────────────────────────────────────────

const CUSTOM_ATTRS_KEY = 'bismuth-rpg-custom-attrs';

function loadCustomAttrs(): CustomAttribute[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ATTRS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomAttrs(attrs: CustomAttribute[]): void {
  try { localStorage.setItem(CUSTOM_ATTRS_KEY, JSON.stringify(attrs)); }
  catch { log.warn('Failed to persist RPG custom attributes'); }
}

export function createCustomAttribute(
  name: string, type: CustomAttributeType, appliesTo: ElementType[], options?: string[],
): CustomAttribute {
  const attr: CustomAttribute = {
    id: generatePrefixedId('rpg-attr'),
    name, type, appliesTo, options,
  };
  const all = loadCustomAttrs();
  all.push(attr);
  saveCustomAttrs(all);
  return attr;
}

export function deleteCustomAttribute(id: string): void {
  saveCustomAttrs(loadCustomAttrs().filter((a) => a.id !== id));
}

export function getCustomAttributesForType(type: ElementType): CustomAttribute[] {
  return loadCustomAttrs().filter((a) => a.appliesTo.includes(type));
}

export function getAllCustomAttributes(): CustomAttribute[] {
  return loadCustomAttrs();
}
