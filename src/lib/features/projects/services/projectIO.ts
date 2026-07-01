/**
 * Project I/O service — reads/writes project and task Markdown files.
 * All data stored as YAML frontmatter in .md files.
 */
import { getNote, createNote, writeNote, deleteNote } from '@/services/vault/vault';
import { parseFrontmatter } from '@/services/frontmatter';
import { log } from '@/utils/logger';
import type { Project, PMTask, PMTaskType, PMStatus, PMPriority, TimeLog, Recurrence, CustomFieldDef } from '../types';

// ─── Frontmatter keys ────────────────────────────────────────────────────────

const PM_PROJECT_KEY = 'pm-project';
const PM_TASK_KEY = 'pm-task';

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Serialization helpers ───────────────────────────────────────────────────

function buildFrontmatter(fields: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function toTaskFrontmatter(task: PMTask): Record<string, unknown> {
  return {
    [PM_TASK_KEY]: true,
    id: task.id,
    title: task.title,
    type: task.type,
    status: task.status,
    priority: task.priority,
    start: task.startDate,
    due: task.dueDate,
    progress: task.progress,
    'time-estimate': task.timeEstimate,
    'time-logs': task.timeLogs.length > 0 ? task.timeLogs : undefined,
    assignees: task.assignees,
    tags: task.tags,
    parent: task.parentId,
    subtasks: task.subtaskIds,
    dependencies: task.dependencies,
    recurrence: task.recurrence,
    'custom-fields': Object.keys(task.customFields).length > 0 ? task.customFields : undefined,
    archived: task.archived || undefined,
    created: task.createdAt,
    updated: task.updatedAt,
  };
}

function toProjectFrontmatter(project: Project): Record<string, unknown> {
  return {
    [PM_PROJECT_KEY]: true,
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    icon: project.icon,
    folder: project.folder,
    'default-view': project.defaultView,
    'custom-fields': project.customFields.length > 0 ? project.customFields : undefined,
    'team-members': project.teamMembers,
    created: project.createdAt,
    updated: project.updatedAt,
  };
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

export function parseTask(fm: Record<string, unknown>, path: string, body: string): PMTask {
  const now = new Date().toISOString();
  return {
    id: String(fm['id'] ?? generateId()),
    path,
    title: String(fm['title'] ?? 'Untitled Task'),
    description: body,
    type: (fm['type'] as PMTaskType) ?? 'task',
    status: (fm['status'] as PMStatus) ?? 'todo',
    priority: (fm['priority'] as PMPriority) ?? 'medium',
    startDate: fm['start'] ? String(fm['start']) : null,
    dueDate: fm['due'] ? String(fm['due']) : null,
    progress: Number(fm['progress'] ?? 0),
    timeEstimate: fm['time-estimate'] != null ? Number(fm['time-estimate']) : null,
    timeLogs: Array.isArray(fm['time-logs']) ? (fm['time-logs'] as TimeLog[]) : [],
    assignees: Array.isArray(fm['assignees']) ? (fm['assignees'] as string[]) : [],
    tags: Array.isArray(fm['tags']) ? (fm['tags'] as string[]) : [],
    parentId: fm['parent'] ? String(fm['parent']) : null,
    subtaskIds: Array.isArray(fm['subtasks']) ? (fm['subtasks'] as string[]) : [],
    dependencies: Array.isArray(fm['dependencies']) ? (fm['dependencies'] as string[]) : [],
    recurrence: fm['recurrence'] as Recurrence | null ?? null,
    customFields: (fm['custom-fields'] as Record<string, unknown>) ?? {},
    archived: Boolean(fm['archived']),
    createdAt: fm['created'] ? String(fm['created']) : now,
    updatedAt: fm['updated'] ? String(fm['updated']) : now,
  };
}

export function parseProject(fm: Record<string, unknown>, path: string, body: string): Project {
  const now = new Date().toISOString();
  return {
    id: String(fm['id'] ?? generateId()),
    path,
    name: String(fm['name'] ?? 'Untitled Project'),
    description: body || String(fm['description'] ?? ''),
    color: String(fm['color'] ?? '#3b82f6'),
    icon: String(fm['icon'] ?? 'briefcase'),
    folder: String(fm['folder'] ?? ''),
    defaultView: (fm['default-view'] as Project['defaultView']) ?? 'table',
    customFields: Array.isArray(fm['custom-fields']) ? (fm['custom-fields'] as CustomFieldDef[]) : [],
    customStatuses: [],
    customPriorities: [],
    teamMembers: Array.isArray(fm['team-members']) ? (fm['team-members'] as string[]) : [],
    createdAt: fm['created'] ? String(fm['created']) : now,
    updatedAt: fm['updated'] ? String(fm['updated']) : now,
  };
}

// ─── File I/O ────────────────────────────────────────────────────────────────

function splitContent(content: string): { body: string } {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)/);
  return { body: match ? match[1].trim() : content.trim() };
}

export async function readTaskFile(path: string): Promise<PMTask | null> {
  try {
    const note = await getNote(path);
    const fm = await parseFrontmatter(note.content);
    if (!fm[PM_TASK_KEY]) return null;
    const { body } = splitContent(note.content);
    return parseTask(fm, path, body);
  } catch (error) {
    log.warn('Failed to read task file', { path, error: String(error) });
    return null;
  }
}

export async function readProjectFile(path: string): Promise<Project | null> {
  try {
    const note = await getNote(path);
    const fm = await parseFrontmatter(note.content);
    if (!fm[PM_PROJECT_KEY]) return null;
    const { body } = splitContent(note.content);
    return parseProject(fm, path, body);
  } catch (error) {
    log.warn('Failed to read project file', { path, error: String(error) });
    return null;
  }
}

export async function writeTaskFile(task: PMTask): Promise<void> {
  const fm = toTaskFrontmatter({ ...task, updatedAt: new Date().toISOString() });
  const content = `${buildFrontmatter(fm)}\n\n${task.description}`;
  try {
    await writeNote(task.path, content);
  } catch {
    await createNote(task.path, content);
  }
}

export async function writeProjectFile(project: Project): Promise<void> {
  const fm = toProjectFrontmatter({ ...project, updatedAt: new Date().toISOString() });
  const content = `${buildFrontmatter(fm)}\n\n${project.description}`;
  try {
    await writeNote(project.path, content);
  } catch {
    await createNote(project.path, content);
  }
}

export async function deleteTaskFile(path: string): Promise<void> {
  await deleteNote(path);
}

export async function deleteProjectFile(path: string): Promise<void> {
  await deleteNote(path);
}
