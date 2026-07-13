/**
 * Writing store — Svelte 5 runes reactive state for writing projects,
 * sessions, sprints, focus timer, and daily history.
 *
 * Synthesized from Longform (drafts/stores), Storyline (WritingTracker),
 * and Book-Smith (FocusManager pomodoro).
 */

import {
  WRITING_FOCUS_KEY,
  WRITING_HISTORY_KEY,
  WRITING_PROJECTS_KEY,
} from '@/constants/storage-keys';
import { awardWritingXp } from '@/hubs/core/stores/gamification-store.svelte';
import {
  findSceneByNotePath,
  sceneNoteContent,
  sceneNotePath,
} from '@/hubs/creative/services/writing-file-service';
import {
  addSceneToGroup,
  advanceStatus,
  computeProgress,
  computeStreak,
  computeWpm,
  countByStatus,
  countWords,
  createDraft,
  createGroup,
  createProject,
  createScene,
  createSprintEntry,
  findSceneById,
  formatTimer,
  getRecentDays,
  insertScene,
  moveScene,
  moveSceneToGroup,
  moveSceneToRoot,
  removeSceneDeep,
  sortScenes,
  thisMonthWords,
  thisWeekWords,
  todayKey,
  totalWordCount,
  updateSceneDeep,
} from '@/hubs/creative/services/writing-service';
import type {
  Draft,
  FocusSettings,
  FocusState,
  SceneNode,
  SceneSortField,
  SceneTemplate,
  SortDirection,
  SprintEntry,
  WritingHistory,
  WritingProject,
} from '@/hubs/creative/types/writing-types';
import { DEFAULT_FOCUS_SETTINGS } from '@/hubs/creative/types/writing-types';
import { createNewNote } from '@/hubs/editor/services/file-ops';
import { log } from '@/utils/log/logger';
import { goto } from '$app/navigation';

// ── Persistence helpers ──────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    log.warn(`writing-store: failed to save ${key}`);
  }
}

// ── State ────────────────────────────────────────────────────────

let projects = $state<WritingProject[]>(loadJSON(WRITING_PROJECTS_KEY, []));
let activeProjectId = $state<string | null>(projects.length > 0 ? projects[0].id : null);
let history = $state<WritingHistory>(loadJSON(WRITING_HISTORY_KEY, { daily: {}, sprints: [] }));
let focusSettings = $state<FocusSettings>(
  loadJSON(WRITING_FOCUS_KEY, { ...DEFAULT_FOCUS_SETTINGS })
);

// ── Focus timer state ────────────────────────────────────────────

let focusState = $state<FocusState>('idle');
let focusRemaining = $state(0);
let focusTimerRef: ReturnType<typeof setInterval> | null = null;
let focusSessionWords = $state(0);

// ── Sprint state ─────────────────────────────────────────────────

let sprintRunning = $state(false);
let sprintStartTime = $state(0);
let sprintBaseline = $state(0);
let sprintDurationMs = $state(25 * 60_000);

// ── Persistence ──────────────────────────────────────────────────

function persistProjects(): void {
  saveJSON(WRITING_PROJECTS_KEY, projects);
}

function persistHistory(): void {
  saveJSON(WRITING_HISTORY_KEY, history);
}

function persistFocus(): void {
  saveJSON(WRITING_FOCUS_KEY, focusSettings);
}

// ── Derived ──────────────────────────────────────────────────────

const activeProject = $derived(projects.find((p) => p.id === activeProjectId) ?? null);
const activeDraft = $derived.by(() => {
  if (!activeProject) return null;
  return activeProject.drafts.find((d) => d.id === activeProject.activeDraftId) ?? null;
});
const activeScenes = $derived(activeDraft?.scenes ?? []);
const projectTotalWords = $derived(totalWordCount(activeScenes));
const projectProgress = $derived(computeProgress(activeScenes));
const statusCounts = $derived(countByStatus(activeScenes));
const streak = $derived(computeStreak(history.daily));
const todayWords = $derived(history.daily[todayKey()] ?? 0);
const weekWords = $derived(thisWeekWords(history.daily));
const monthWords = $derived(thisMonthWords(history.daily));
const recentDays = $derived(getRecentDays(history.daily, 14));

// ── Getters ──────────────────────────────────────────────────────

export function getProjects(): WritingProject[] {
  return projects;
}
export function getActiveProject(): WritingProject | null {
  return activeProject;
}
function getActiveDraft(): Draft | null {
  return activeDraft;
}
export function getActiveScenes(): SceneNode[] {
  return activeScenes;
}
export function getProjectTotalWords(): number {
  return projectTotalWords;
}
export function getProjectProgress(): number {
  return projectProgress;
}
export function getStatusCounts(): Record<string, number> {
  return statusCounts;
}
export function getStreak(): number {
  return streak;
}
export function getTodayWords(): number {
  return todayWords;
}
export function getWeekWords(): number {
  return weekWords;
}
export function getMonthWords(): number {
  return monthWords;
}
export function getRecentHistory(): { date: string; words: number }[] {
  return recentDays;
}
function getHistory(): WritingHistory {
  return history;
}
function getFocusSettings(): FocusSettings {
  return focusSettings;
}
export function getFocusState(): FocusState {
  return focusState;
}
export function getFocusRemaining(): number {
  return focusRemaining;
}
function getFocusSessionWords(): number {
  return focusSessionWords;
}
function getFocusTimerDisplay(): string {
  return formatTimer(focusRemaining);
}
function isSprintRunning(): boolean {
  return sprintRunning;
}
function getSprintDurationMs(): number {
  return sprintDurationMs;
}

function getSprintElapsed(): number {
  if (!sprintRunning) return 0;
  return Date.now() - sprintStartTime;
}

function getSprintWords(currentWords: number): number {
  if (!sprintRunning) return 0;
  return Math.max(0, currentWords - sprintBaseline);
}

function getSprintWpm(currentWords: number): number {
  return computeWpm(getSprintWords(currentWords), getSprintElapsed());
}

// ── Project actions ──────────────────────────────────────────────

export function addProject(title: string, author = ''): WritingProject {
  const project = createProject(title, author);
  projects = [...projects, project];
  activeProjectId = project.id;
  persistProjects();
  return project;
}

export function deleteProject(projectId: string): void {
  projects = projects.filter((p) => p.id !== projectId);
  if (activeProjectId === projectId) {
    activeProjectId = projects.length > 0 ? projects[0].id : null;
  }
  persistProjects();
}

export function setActiveProject(projectId: string): void {
  if (projects.some((p) => p.id === projectId)) {
    activeProjectId = projectId;
  }
}

export function updateProject(projectId: string, updates: Partial<WritingProject>): void {
  projects = projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p));
  persistProjects();
}

// ── Draft actions ────────────────────────────────────────────────

export function addDraft(title: string): void {
  if (!activeProject) return;
  const draft = createDraft(title);
  const updated = {
    ...activeProject,
    drafts: [...activeProject.drafts, draft],
    activeDraftId: draft.id,
  };
  projects = projects.map((p) => (p.id === updated.id ? updated : p));
  persistProjects();
}

export function setActiveDraft(draftId: string): void {
  if (!activeProject) return;
  const updated = { ...activeProject, activeDraftId: draftId };
  projects = projects.map((p) => (p.id === updated.id ? updated : p));
  persistProjects();
}

export function deleteDraft(draftId: string): void {
  if (!activeProject || activeProject.drafts.length <= 1) return;
  const filtered = activeProject.drafts.filter((d) => d.id !== draftId);
  const updated = {
    ...activeProject,
    drafts: filtered,
    activeDraftId:
      activeProject.activeDraftId === draftId ? filtered[0].id : activeProject.activeDraftId,
  };
  projects = projects.map((p) => (p.id === updated.id ? updated : p));
  persistProjects();
}

// ── Scene actions ────────────────────────────────────────────────

function updateActiveScenes(scenes: SceneNode[]): void {
  if (!activeProject || !activeDraft) return;
  const updatedDraft = { ...activeDraft, scenes };
  const updatedProject = {
    ...activeProject,
    drafts: activeProject.drafts.map((d) => (d.id === updatedDraft.id ? updatedDraft : d)),
  };
  projects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
  persistProjects();
}

export function addScene(title: string, template?: SceneTemplate, parentGroupId?: string): void {
  const scene = createScene(title, template, activeScenes.length);
  if (parentGroupId) {
    updateActiveScenes(addSceneToGroup(activeScenes, parentGroupId, scene));
  } else {
    updateActiveScenes(insertScene(activeScenes, scene, activeScenes.length));
  }
}

export function addGroup(title: string): void {
  const group = createGroup(title, activeScenes.length);
  updateActiveScenes(insertScene(activeScenes, group, activeScenes.length));
}

export function removeSceneById(sceneId: string): void {
  updateActiveScenes(removeSceneDeep(activeScenes, sceneId));
}

function moveSceneByIndex(fromIndex: number, toIndex: number): void {
  updateActiveScenes(moveScene(activeScenes, fromIndex, toIndex));
}

export function nestSceneInGroup(sceneId: string, groupId: string, index?: number): void {
  updateActiveScenes(moveSceneToGroup(activeScenes, sceneId, groupId, index));
}

export function unnestScene(sceneId: string, index?: number): void {
  updateActiveScenes(moveSceneToRoot(activeScenes, sceneId, index));
}

function updateScene(sceneId: string, updates: Partial<SceneNode>): void {
  updateActiveScenes(updateSceneDeep(activeScenes, sceneId, updates));
}

export function advanceSceneStatus(sceneId: string): void {
  const scene = findSceneById(activeScenes, sceneId);
  if (!scene) return;
  updateScene(sceneId, { status: advanceStatus(scene.status) });
}

export function sortScenesBy(field: SceneSortField, direction: SortDirection = 'asc'): void {
  updateActiveScenes(sortScenes(activeScenes, field, direction));
}

/**
 * Open (or create) the vault note for a scene.
 * Creates the project folder structure on first access,
 * scaffolds a markdown note, opens it in the editor, and navigates there.
 */
export async function openSceneNote(sceneId: string): Promise<void> {
  const scene = findSceneById(activeScenes, sceneId);
  if (!scene || scene.type !== 'file') return;
  if (!activeProject || !activeDraft) return;

  const path = sceneNotePath(activeProject, activeDraft, activeScenes, scene);
  const folder = path.slice(0, path.lastIndexOf('/'));
  const content = sceneNoteContent(scene);

  // Persist the note path on the scene so we can sync word counts later
  if (scene.notePath !== path) {
    updateScene(sceneId, { notePath: path });
  }

  try {
    await createNewNote(scene.title, folder, content);
  } catch {
    log.warn('writing-store: note may already exist, opening', { path });
    const { openNoteFile } = await import('@/hubs/editor/services/file-ops');
    await openNoteFile(path);
  }

  goto('/editor');
}

/**
 * Sync a scene's word count from its saved note content.
 * Called by the editor after saving a note that belongs to a writing scene.
 */
export function syncSceneWordCount(notePath: string, noteContent: string): void {
  if (!activeDraft) return;
  const scene = findSceneByNotePath(activeScenes, notePath);
  if (!scene) return;
  const wc = countWords(noteContent);
  if (scene.wordCount !== wc) {
    updateScene(scene.id, { wordCount: wc });
    log.debug('writing-store: synced scene word count', { sceneId: scene.id, wordCount: wc });
  }
}

// ── Daily history ────────────────────────────────────────────────

export function recordWords(words: number): void {
  if (words <= 0) return;
  const today = todayKey();
  history = {
    ...history,
    daily: {
      ...history.daily,
      [today]: (history.daily[today] ?? 0) + words,
    },
  };
  awardWritingXp(words);
  persistHistory();
}

// ── Sprint ───────────────────────────────────────────────────────

function startSprint(currentWords: number): void {
  sprintRunning = true;
  sprintStartTime = Date.now();
  sprintBaseline = currentWords;
}

function stopSprint(currentWords: number): SprintEntry | null {
  if (!sprintRunning) return null;
  sprintRunning = false;
  const elapsed = Date.now() - sprintStartTime;
  const words = Math.max(0, currentWords - sprintBaseline);
  const entry = createSprintEntry(words, elapsed);
  history = {
    ...history,
    sprints: [...history.sprints, entry],
  };
  persistHistory();
  return entry;
}

function setSprintDuration(ms: number): void {
  sprintDurationMs = Math.max(60_000, ms);
}

function resetSprint(): void {
  sprintRunning = false;
  sprintStartTime = 0;
  sprintBaseline = 0;
}

// ── Focus timer ──────────────────────────────────────────────────

export function startFocus(): void {
  if (focusState !== 'idle') return;
  focusState = 'working';
  focusRemaining = focusSettings.workDurationMin * 60;
  focusSessionWords = 0;
  startFocusTimer();
}

export function pauseFocus(): void {
  if (focusState !== 'working') return;
  focusState = 'paused';
  clearFocusTimer();
}

export function resumeFocus(): void {
  if (focusState !== 'paused') return;
  focusState = 'working';
  startFocusTimer();
}

export function endFocus(): void {
  if (focusState === 'idle') return;
  clearFocusTimer();
  focusState = 'idle';
  focusRemaining = 0;
}

function updateFocusSettings(settings: Partial<FocusSettings>): void {
  focusSettings = { ...focusSettings, ...settings };
  persistFocus();
}

function addFocusWords(words: number): void {
  focusSessionWords += words;
}

function startFocusTimer(): void {
  clearFocusTimer();
  focusTimerRef = setInterval(() => {
    focusRemaining = Math.max(0, focusRemaining - 1);
    if (focusRemaining <= 0) {
      if (focusState === 'working') {
        // Transition to break
        focusState = 'break';
        focusRemaining = focusSettings.breakDurationMin * 60;
      } else if (focusState === 'break') {
        endFocus();
      }
    }
  }, 1000);
}

function clearFocusTimer(): void {
  if (focusTimerRef) {
    clearInterval(focusTimerRef);
    focusTimerRef = null;
  }
}

// ── Cleanup ──────────────────────────────────────────────────────

function destroyWritingStore(): void {
  clearFocusTimer();
  resetSprint();
}
