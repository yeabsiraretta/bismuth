/**
 * Checklist store — consolidated checklist view config and derived data.
 *
 * Filters tasks by tag (default: #todo), groups by file or tag,
 * supports glob-based file inclusion, and persists settings.
 */

import { writable, derived } from 'svelte/store';
import type { Task } from '@/types/data/task';
import { tasks } from './tasks';
import { log } from '@/utils/logger';

const STORAGE_KEY = 'bismuth-checklist-config';

export type ChecklistGroupBy = 'file' | 'tag' | 'priority' | 'none';
export type ChecklistSort = 'newest' | 'oldest' | 'priority' | 'alphabetical';

export interface ChecklistConfig {
  /** Tag name to filter by (without #), e.g. 'todo' */
  tagName: string;
  /** Whether to show completed tasks */
  showCompleted: boolean;
  /** Show all todos in file when tag is present, not just tagged block */
  showAllInFile: boolean;
  /** Group results by file, tag, priority, or flat */
  groupBy: ChecklistGroupBy;
  /** Sort order */
  sort: ChecklistSort;
  /** Glob pattern for file inclusion (empty = all files) */
  includeGlob: string;
}

const DEFAULT_CONFIG: ChecklistConfig = {
  tagName: 'todo',
  showCompleted: false,
  showAllInFile: false,
  groupBy: 'file',
  sort: 'oldest',
  includeGlob: '',
};

function loadConfig(): ChecklistConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export const checklistConfig = writable<ChecklistConfig>(loadConfig());

/** Simple glob matcher supporting * and ** and ! negation */
export function matchGlob(path: string, glob: string): boolean {
  if (!glob.trim()) return true;
  const parts = glob
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  let included = parts.length === 0;
  for (const part of parts) {
    if (part.startsWith('!')) {
      const pattern = part.slice(1);
      if (simpleGlobMatch(path, pattern)) return false;
    } else {
      if (simpleGlobMatch(path, part)) included = true;
    }
  }
  return included;
}

function simpleGlobMatch(path: string, pattern: string): boolean {
  // Strip enclosing braces for multi-pattern: {a,b} splits handled by caller
  const p = pattern.replace(/^\{|}$/g, '');
  const regexStr = p
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')
    .replace(/\?/g, '.');
  try {
    return new RegExp(`^${regexStr}$`).test(path);
  } catch {
    return true;
  }
}

/** Derived: tasks filtered by checklist config */
export const checklistTasks = derived([tasks, checklistConfig], ([$tasks, $config]) => {
  return $tasks.filter((task) => {
    // Status filter
    if (!$config.showCompleted && task.status === 'done') return false;

    // Tag filter
    if ($config.tagName) {
      const hasTag = task.tags.some((t) => t.toLowerCase() === $config.tagName.toLowerCase());
      if (!hasTag && !$config.showAllInFile) return false;
      // showAllInFile: include if any task in same file has the tag
      if (!hasTag && $config.showAllInFile) {
        const fileHasTag = $tasks.some(
          (other) =>
            other.source_path === task.source_path &&
            other.tags.some((t) => t.toLowerCase() === $config.tagName.toLowerCase())
        );
        if (!fileHasTag) return false;
      }
    }

    // Glob filter
    if ($config.includeGlob && !matchGlob(task.source_path, $config.includeGlob)) {
      return false;
    }

    return true;
  });
});

export interface ChecklistGroup {
  key: string;
  label: string;
  tasks: Task[];
}

/** Derived: grouped checklist results */
export const checklistGroups = derived([checklistTasks, checklistConfig], ([$tasks, $config]) => {
  const sorted = sortTasks($tasks, $config.sort);
  return groupTasks(sorted, $config.groupBy);
});

function sortTasks(items: Task[], sort: ChecklistSort): Task[] {
  const copy = [...items];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.source_path.localeCompare(a.source_path));
    case 'oldest':
      return copy.sort((a, b) => a.source_path.localeCompare(b.source_path));
    case 'priority': {
      const order: Record<string, number> = {
        critical: 0,
        highest: 1,
        high: 2,
        medium: 3,
        none: 4,
        low: 5,
        lowest: 6,
      };
      return copy.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
    }
    case 'alphabetical':
      return copy.sort((a, b) => a.text.localeCompare(b.text));
    default:
      return copy;
  }
}

function groupTasks(items: Task[], groupBy: ChecklistGroupBy): ChecklistGroup[] {
  if (groupBy === 'none') {
    return items.length ? [{ key: 'all', label: 'All Tasks', tasks: items }] : [];
  }

  const map = new Map<string, Task[]>();
  for (const task of items) {
    let keys: string[];
    switch (groupBy) {
      case 'file':
        keys = [task.source_path];
        break;
      case 'tag':
        keys = task.tags.length ? task.tags : ['untagged'];
        break;
      case 'priority':
        keys = [task.priority];
        break;
      default:
        keys = ['other'];
    }
    for (const key of keys) {
      const arr = map.get(key) ?? [];
      arr.push(task);
      map.set(key, arr);
    }
  }

  return [...map.entries()].map(([key, tasks]) => ({
    key,
    label: groupBy === 'file' ? extractFileName(key) : `#${key}`,
    tasks,
  }));
}

function extractFileName(path: string): string {
  const parts = path.split('/');
  const file = parts[parts.length - 1] ?? path;
  return file.replace(/\.md$/, '');
}

/** Derived: distinct tags from all tasks */
export const checklistTags = derived(tasks, ($tasks) => {
  const tagSet = new Set<string>();
  $tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
  return [...tagSet].sort();
});

/** Persist config */
checklistConfig.subscribe((config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    log.warn('Failed to persist checklist config', { error: String(e) });
  }
});
