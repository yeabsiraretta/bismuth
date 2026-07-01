/**
 * Storyteller Suite — Series, writing goals, sprint, archive, snapshots,
 * export, research, and corkboard types.
 */

// ─── Series ─────────────────────────────────────────────────────────────────

export interface Series {
  id: string;
  name: string;
  bookIds: string[];
  sharedCodexPath: string;
  createdAt: string;
}

export interface BookInSeries {
  bookId: string;
  seriesId: string;
  sortOrder: number;
  bookOnlyEntityIds: string[];
}

// ─── Writing Goals & Sprint ─────────────────────────────────────────────────

export interface WritingGoals {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
}

export const DEFAULT_WRITING_GOALS: WritingGoals = {
  dailyTarget: 500, weeklyTarget: 3500, monthlyTarget: 15000,
};

export interface WritingSprint {
  isRunning: boolean;
  durationMinutes: number;
  startedAt: string | null;
  wordsAtStart: number;
  wordsWritten: number;
}

export interface WritingSession {
  date: string;
  wordsWritten: number;
  minutesWritten: number;
  sessionsCount: number;
}

export interface WritingStreak {
  currentDays: number;
  longestDays: number;
  lastWritingDate: string | null;
}

// ─── Scene Archive ──────────────────────────────────────────────────────────

export interface ArchivedScene {
  entityId: string;
  archivedAt: string;
  originalChapterId: string | null;
  originalSortOrder: number;
}

// ─── View Snapshots ─────────────────────────────────────────────────────────

export interface ViewSnapshot {
  id: string;
  name: string;
  storyId: string;
  createdAt: string;
  corkboardPositions: Record<string, { x: number; y: number }>;
  plotgridState: Record<string, string>;
  sceneOrdering: string[];
}

// ─── Export ─────────────────────────────────────────────────────────────────

export type ExportFormat = 'markdown' | 'json' | 'csv' | 'html' | 'pdf' | 'docx';
export type ExportScope = 'outline' | 'manuscript';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeMetadata: boolean;
  includeStats: boolean;
  pageSize: 'letter' | 'a4' | 'a5';
  fontFamily: string;
  fontSize: number;
  marginMm: number;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'markdown', scope: 'manuscript',
  includeMetadata: true, includeStats: false,
  pageSize: 'letter', fontFamily: 'serif', fontSize: 12, marginMm: 25,
};

// ─── Research ───────────────────────────────────────────────────────────────

export type ResearchPostType = 'note' | 'web-clip' | 'image' | 'question';

export interface ResearchPost {
  id: string;
  storyId: string;
  type: ResearchPostType;
  title: string;
  content: string;
  tags: string[];
  url?: string;
  imagePath?: string;
  createdAt: string;
}

// ─── Corkboard ──────────────────────────────────────────────────────────────

export type StickyNoteTheme = 'classic' | 'pastel' | 'earth' | 'jewel' | 'neon' | 'mono';

export interface CorkboardNote {
  id: string;
  storyId: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isImage: boolean;
  imagePath?: string;
  caption?: string;
  convertedToSceneId?: string;
}

// ─── Custom Scene Fields ────────────────────────────────────────────────────

export type CustomSceneFieldType = 'text' | 'textarea' | 'dropdown' | 'multi-select';

export interface CustomSceneField {
  id: string;
  name: string;
  type: CustomSceneFieldType;
  options?: string[];
  optionsFolder?: string;
}

// ─── Focus Mode ─────────────────────────────────────────────────────────────

export interface FocusModeSettings {
  enabled: boolean;
  dimAmount: number;
  darkenAmount: number;
  blurAmount: number;
}

export const DEFAULT_FOCUS_MODE: FocusModeSettings = {
  enabled: false, dimAmount: 0.5, darkenAmount: 0.3, blurAmount: 4,
};

// ─── Codex Category ─────────────────────────────────────────────────────────

export interface CodexCategory {
  id: string;
  name: string;
  folderName: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
}

export const BUILTIN_CODEX_CATEGORIES: CodexCategory[] = [
  { id: 'characters', name: 'Characters', folderName: 'Characters', icon: 'user', color: '#7c3aed', isBuiltIn: true },
  { id: 'locations', name: 'Locations', folderName: 'Locations', icon: 'map-pin', color: '#059669', isBuiltIn: true },
];

// ─── Plot Hole Detection ────────────────────────────────────────────────────

export type PlotHoleCategory =
  | 'unresolved-setup' | 'missing-character' | 'timeline-gap'
  | 'location-conflict' | 'continuity-error' | 'orphan-plotline';

export interface PlotHoleWarning {
  id: string;
  category: PlotHoleCategory;
  severity: 'info' | 'warning' | 'error';
  message: string;
  sceneIds: string[];
  entityIds: string[];
}
