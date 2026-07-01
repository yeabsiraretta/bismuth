/**
 * Project store — project list, active project, settings, team management.
 * Persists settings to localStorage; project data lives in vault files.
 */
import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import type { Project, PMSettings, PMViewMode, SavedView } from '../types';
import { DEFAULT_PM_SETTINGS } from '../types';
import {
  readProjectFile,
  writeProjectFile,
  deleteProjectFile,
  generateId,
} from '../services/projectIO';

// ─── Storage keys ────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'bismuth-pm-settings';
const VIEWS_KEY = 'bismuth-pm-saved-views';

function loadSettings(): PMSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_PM_SETTINGS, ...JSON.parse(stored) } : DEFAULT_PM_SETTINGS;
  } catch {
    return DEFAULT_PM_SETTINGS;
  }
}

function persistSettings(s: PMSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadSavedViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(VIEWS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ─── Stores ──────────────────────────────────────────────────────────────────

export const projects = writable<Project[]>([]);
export const activeProjectId = writable<string | null>(null);
export const projectsLoading = writable(false);
export const activeView = writable<PMViewMode>('table');
export const pmSettings = writable<PMSettings>(loadSettings());
export const savedViews = writable<SavedView[]>(loadSavedViews());

// Persist settings on change
pmSettings.subscribe((s) => persistSettings(s));
savedViews.subscribe((v) => localStorage.setItem(VIEWS_KEY, JSON.stringify(v)));

// ─── Derived ─────────────────────────────────────────────────────────────────

export const activeProject = derived(
  [projects, activeProjectId],
  ([$projects, $id]) => $projects.find((p) => p.id === $id) ?? null
);

export const projectCount = derived(projects, ($p) => $p.length);

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function loadProjects(folder: string): Promise<void> {
  projectsLoading.set(true);
  try {
    const { scanVault } = await import('@/services/vault/vault');
    const allNotes = await scanVault();
    const projectNotes = allNotes.filter(
      (n) => n.path.startsWith(folder) && n.frontmatter?.['pm-project'] === true
    );

    const loaded: Project[] = [];
    for (const note of projectNotes) {
      const project = await readProjectFile(note.path);
      if (project) loaded.push(project);
    }
    projects.set(loaded);
    log.info('Loaded projects', { count: loaded.length });
  } catch (error) {
    log.error('Failed to load projects', error as Error);
  } finally {
    projectsLoading.set(false);
  }
}

export async function createProject(name: string, color: string, icon: string): Promise<Project> {
  const settings = get(pmSettings);
  const id = generateId();
  const now = new Date().toISOString();
  const folder = `${settings.projectsFolder}/${name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`;

  const project: Project = {
    id,
    path: `${folder}/_project.md`,
    name,
    description: '',
    color,
    icon,
    folder,
    defaultView: settings.defaultView,
    customFields: [],
    customStatuses: [],
    customPriorities: [],
    teamMembers: [],
    createdAt: now,
    updatedAt: now,
  };

  await writeProjectFile(project);
  projects.update((list) => [...list, project]);
  activeProjectId.set(id);
  activeView.set(project.defaultView);
  log.info('Created project', { id, name });
  return project;
}

export async function updateProject(updated: Project): Promise<void> {
  await writeProjectFile(updated);
  projects.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
}

export async function removeProject(id: string): Promise<void> {
  const list = get(projects);
  const project = list.find((p) => p.id === id);
  if (!project) return;
  await deleteProjectFile(project.path);
  projects.update((l) => l.filter((p) => p.id !== id));
  if (get(activeProjectId) === id) activeProjectId.set(null);
  log.info('Deleted project', { id });
}

export function openProject(id: string): void {
  const list = get(projects);
  const project = list.find((p) => p.id === id);
  activeProjectId.set(id);
  if (project) activeView.set(project.defaultView);
}

export function closeProject(): void {
  activeProjectId.set(null);
}

// ─── Saved views ─────────────────────────────────────────────────────────────

export function addSavedView(view: Omit<SavedView, 'id'>): void {
  const id = generateId();
  savedViews.update((views) => [...views, { ...view, id }]);
}

export function removeSavedView(id: string): void {
  savedViews.update((views) => views.filter((v) => v.id !== id));
}
