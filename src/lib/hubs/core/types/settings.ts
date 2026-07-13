import { DEFAULT_CATEGORY_COLORS, PALETTE } from '@/constants/colors';
import type { HighlighterColor, HighlighterMode } from '@/hubs/editor/services/highlighter-service';
import { DEFAULT_HIGHLIGHTER_COLORS } from '@/hubs/editor/services/highlighter-service';
import type { SchedulerAlgorithm } from '@/hubs/knowledge/types/flashcard-types';
import type { PdfHighlightColor } from '@/hubs/media/types/pdf-types';
import { DEFAULT_PDF_HIGHLIGHT_COLORS } from '@/hubs/media/types/pdf-types';

// ─── General ─────────────────────────────────────────────────────────────────

export interface GeneralSettings {
  language: string;
  autoSave: boolean;
  autoSaveDelay: number;
  confirmBeforeDelete: boolean;
  defaultNoteLocation: string;
  dateFormat: string;
  timeFormat: string;
  newFileNameTemplate: string;
  homepage: HomepageConfig;
}

interface HomepageConfig {
  option: 'last-opened' | 'daily-note' | 'specific-note' | 'empty' | 'homepage';
  specificNotePath: string;
}

// ─── Updates ─────────────────────────────────────────────────────────────────

export interface UpdateSettings {
  autoCheckUpdates: boolean;
  lastUpdateCheck: number;
  updateChannel: 'alpha' | 'beta' | 'release';
}

// ─── Performance ─────────────────────────────────────────────────────────────

export interface PerformanceSettings {
  startupThresholdMs: number;
  lazyLoadExtensions: boolean;
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  highlightActiveLine: boolean;
  readableLineLength: boolean;
  readableLineLengthWidth: number;
  frontmatterMode: 'hidden' | 'source' | 'properties';
  wordWrap: boolean;
  hardLineBreaks: boolean;
  spellCheck: boolean;
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace: boolean;
  closeBrackets: boolean;
  floatingToolbar: boolean;
  showFoldGutter: boolean;
  livePreview: boolean;
  livePreviewMode: 'source' | 'live' | 'reading';
  readOnly: boolean;
  defaultSpeedReaderWpm: number;
  slashCommands: boolean;
}

// ─── Typewriter / Zen ────────────────────────────────────────────────────────

export interface TypewriterSettings {
  typewriterEnabled: boolean;
  typewriterOffset: number;
  typewriterOnlyKeyboard: boolean;
  zenModeEnabled: boolean;
  zenModeVisibleLines: number;
  zenModeDimOpacity: number;
}

// ─── Vim ─────────────────────────────────────────────────────────────────────

export interface VimSettings {
  vimMode: boolean;
  vimrcPath: string;
  vimShowMode: boolean;
}

// ─── Appearance ──────────────────────────────────────────────────────────────

export interface CssSnippetEntry {
  name: string;
  enabled: boolean;
}

export interface AppearanceSettings {
  accentColor: string;
  showStatusBar: boolean;
  compactMode: boolean;
  nativeFrame: boolean;
  translucency: boolean;
  activeThemePath: string;
  uiScale: number;
  interfaceFontSize: number;
  fontInterface: string;
  fontText: string;
  fontMono: string;
  sidebarShowIcons: boolean;
  showScrollbars: boolean;
  cssSnippets: CssSnippetEntry[];
}

// ─── Vault ───────────────────────────────────────────────────────────────────

export interface VaultSettings {
  enableGit: boolean;
  autoCommit: boolean;
  syncOnStartup: boolean;
  commitMessageTemplate: string;
  enableBackups: boolean;
}

// ─── Changelog (absorbed into base) ──────────────────────────────────────────

export interface ChangelogSettings {
  changelogAutoUpdate: boolean;
  changelogPath: string;
  changelogDatetimeFormat: string;
  changelogMaxFiles: number;
  changelogUseWikilinks: boolean;
  changelogHeading: string;
  changelogExcludedFolders: string;
  changelogVersion: string;
}

// ─── Versioning (Knowledge hub) ──────────────────────────────────────────────

export interface VersioningSettings {
  versioningEnabled: boolean;
  versionRetentionCount: number;
  versioningLlmClassify: boolean;
}

// ─── LLM / AI ────────────────────────────────────────────────────────────────

export interface LlmSettings {
  llmEnabled: boolean;
  llmNoteContext: boolean;
  llmMaxHistory: number;
  llmApiKey: string;
  llmApiUrl: string;
  llmModel: string;
  llmProvider: 'openai' | 'anthropic' | 'ollama' | 'custom';
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface MediaSettings {
  musicEnabled: boolean;
  voiceFormat: 'webm' | 'ogg' | 'mp3';
  voiceQuality: 'low' | 'medium' | 'high';
  ocrEnabled: boolean;
  ocrDefaultLanguage: string;
  ocrLlmCorrection: boolean;
  ocrLlmCloudEnabled: boolean;
  ocrModelPath: string;
  ocrAmharicModelPath: string;
}

// ─── Integration ─────────────────────────────────────────────────────────────

type NasBackupFrequency = 'manual' | 'on-open' | 'daily' | 'weekly';

export interface IntegrationSettings {
  nasEnabled: boolean;
  nasPath: string;
  nasBackupOnOpen: boolean;
  nasBackupFrequency: NasBackupFrequency;
  nasMaxBackups: number;
  nasLastBackup: string;
  flashcardsEnabled: boolean;
  ankiConnectPort: number;
  ankiDeckPrefix: string;
  ankiBackupFolder: string;
  ankiAutoSync: boolean;
  flashcardsAutoScan: boolean;
  schedulerAlgorithm: SchedulerAlgorithm;
}

// ─── Calendar ────────────────────────────────────────────────────────────────

interface CalendarCategory {
  id: string;
  name: string;
  color: string;
}

export interface CalendarSettings {
  calendarCategories: CalendarCategory[];
  defaultView: 'day' | 'week' | 'month' | 'year' | 'list';
  weekStartsOn: 0 | 1;
  defaultEventDuration: number;
  showCompletedEvents: boolean;
  timeSlotHeight: number;
  showNoteBlurbs: boolean;
  eventNoteFolder: string;
  icsImportFolder: string;
  icsExportFolder: string;
  icsAutoImport: boolean;
}

// ─── Canvas ──────────────────────────────────────────────────────────────────

export interface CanvasSettings {
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  defaultZoom: number;
  showMinimap: boolean;
}

// ─── Graph ───────────────────────────────────────────────────────────────────

export interface GraphSettings {
  viewMode: '2d' | '3d';
  nodeRadius: number;
  linkDistance: number;
  repulsionForce: number;
  centerGravity: number;
  damping: number;
  showLabels: boolean;
  labelThreshold: number;
  nodeColor: string;
  edgeColor: string;
  edgeOpacity: number;
}

// ─── Highlighter ─────────────────────────────────────────────────────────────

interface HighlighterSettings {
  highlighterColors: HighlighterColor[];
  highlighterMode: HighlighterMode;
  highlighterDefaultColor: string;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

interface PdfSettings {
  pdfHighlightColors: PdfHighlightColor[];
  pdfDefaultHighlightColor: string;
  pdfCopyTemplate: string;
  pdfDisplayTextFormat: string;
  pdfOpenSameTab: boolean;
  pdfSidebarDefault: 'none' | 'outline' | 'thumbnails';
  pdfEmbedTrimSelection: boolean;
  pdfEmbedMargin: number;
  pdfEmbedHideToolbar: boolean;
  pdfBacklinkHighlighting: boolean;
  pdfHighlightClearDelay: number;
}

// ─── Knowledge ──────────────────────────────────────────────────────────

export interface KnowledgeSettings {
  topicLinkingEnabled: boolean;
  topicLinkMinTitleLength: number;
  topicLinkCaseSensitive: boolean;
  writingDailyGoal: number;
  writingSprintDuration: number;
  writingAutoSave: boolean;
}

// ─── Gamification ───────────────────────────────────────────────────────

export interface GamificationSettings {
  gamificationEnabled: boolean;
  showXpNotifications: boolean;
  showStreakReminders: boolean;
  enableAchievements: boolean;
  enableDailyChallenges: boolean;
  xpPerEdit: number;
  xpPerCard: number;
  xpPerNoteCreate: number;
  xpPerTaskComplete: number;
  xpPer100Words: number;
  dailyLoginXp: number;
  streakBonusXp: number;
  streakBonusThreshold: number;
}

// ─── Window ──────────────────────────────────────────────────────────────────

export interface WindowSettings {
  startFullscreen: boolean;
  restoreLastSize: boolean;
  restoreLastPosition: boolean;
  closeToTray: boolean;
  minimizeToTray: boolean;
}

// ─── Composite ───────────────────────────────────────────────────────────────

export interface BismuthSettings {
  general: GeneralSettings;
  updates: UpdateSettings;
  performance: PerformanceSettings;
  editor: EditorSettings;
  typewriter: TypewriterSettings;
  vim: VimSettings;
  appearance: AppearanceSettings;
  vault: VaultSettings;
  changelog: ChangelogSettings;
  versioning: VersioningSettings;
  llm: LlmSettings;
  media: MediaSettings;
  integration: IntegrationSettings;
  calendar: CalendarSettings;
  canvas: CanvasSettings;
  graph: GraphSettings;
  highlighter: HighlighterSettings;
  pdf: PdfSettings;
  knowledge: KnowledgeSettings;
  gamification: GamificationSettings;
  window: WindowSettings;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: BismuthSettings = {
  general: {
    language: 'en',
    autoSave: true,
    autoSaveDelay: 500,
    confirmBeforeDelete: true,
    defaultNoteLocation: '',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: '24h',
    newFileNameTemplate: 'Untitled',
    homepage: { option: 'last-opened', specificNotePath: '' },
  },
  updates: {
    autoCheckUpdates: false,
    lastUpdateCheck: 0,
    updateChannel: 'release',
  },
  performance: {
    startupThresholdMs: 4000,
    lazyLoadExtensions: true,
  },
  editor: {
    fontSize: 16,
    lineHeight: 1.6,
    showLineNumbers: false,
    highlightActiveLine: true,
    readableLineLength: true,
    readableLineLengthWidth: 80,
    frontmatterMode: 'hidden',
    wordWrap: true,
    hardLineBreaks: false,
    spellCheck: true,
    tabSize: 2,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    closeBrackets: true,
    floatingToolbar: true,
    showFoldGutter: true,
    livePreview: true,
    livePreviewMode: 'live',
    readOnly: false,
    defaultSpeedReaderWpm: 300,
    slashCommands: false,
  },
  typewriter: {
    typewriterEnabled: false,
    typewriterOffset: 0.5,
    typewriterOnlyKeyboard: true,
    zenModeEnabled: false,
    zenModeVisibleLines: 5,
    zenModeDimOpacity: 0.25,
  },
  vim: {
    vimMode: false,
    vimrcPath: '.bismuth.vimrc',
    vimShowMode: true,
  },
  appearance: {
    accentColor: PALETTE.red,
    showStatusBar: true,
    compactMode: false,
    nativeFrame: true,
    translucency: false,
    activeThemePath: '',
    uiScale: 100,
    interfaceFontSize: 14,
    fontInterface: 'Inter Variable',
    fontText: 'Inter Variable',
    fontMono: 'JetBrains Mono',
    sidebarShowIcons: true,
    showScrollbars: true,
    cssSnippets: [],
  },
  vault: {
    enableGit: false,
    autoCommit: false,
    syncOnStartup: false,
    commitMessageTemplate: 'Update [filename]',
    enableBackups: false,
  },
  changelog: {
    changelogAutoUpdate: false,
    changelogPath: 'Changelog.md',
    changelogDatetimeFormat: "yyyy-MM-dd'T'HH:mm",
    changelogMaxFiles: 25,
    changelogUseWikilinks: true,
    changelogHeading: '',
    changelogExcludedFolders: '',
    changelogVersion: '0.1.0',
  },
  versioning: {
    versioningEnabled: false,
    versionRetentionCount: 50,
    versioningLlmClassify: false,
  },
  llm: {
    llmEnabled: false,
    llmNoteContext: false,
    llmMaxHistory: 20,
    llmApiKey: '',
    llmApiUrl: 'https://api.openai.com/v1',
    llmModel: 'gpt-4o-mini',
    llmProvider: 'openai',
  },
  media: {
    musicEnabled: false,
    voiceFormat: 'webm',
    voiceQuality: 'medium',
    ocrEnabled: false,
    ocrDefaultLanguage: 'en',
    ocrLlmCorrection: false,
    ocrLlmCloudEnabled: false,
    ocrModelPath: '',
    ocrAmharicModelPath: '',
  },
  integration: {
    nasEnabled: false,
    nasPath: '',
    nasBackupOnOpen: true,
    nasBackupFrequency: 'on-open' as NasBackupFrequency,
    nasMaxBackups: 5,
    nasLastBackup: '',
    flashcardsEnabled: false,
    ankiConnectPort: 8765,
    ankiDeckPrefix: 'Bismuth',
    ankiBackupFolder: 'anki-backup',
    ankiAutoSync: false,
    flashcardsAutoScan: true,
    schedulerAlgorithm: 'sm2' as SchedulerAlgorithm,
  },
  calendar: {
    calendarCategories: [
      { id: 'default', name: 'Default', color: DEFAULT_CATEGORY_COLORS.default },
      { id: 'work', name: 'Work', color: DEFAULT_CATEGORY_COLORS.work },
      { id: 'personal', name: 'Personal', color: DEFAULT_CATEGORY_COLORS.personal },
    ],
    defaultView: 'month',
    weekStartsOn: 0,
    defaultEventDuration: 60,
    showCompletedEvents: true,
    timeSlotHeight: 48,
    showNoteBlurbs: true,
    eventNoteFolder: '',
    icsImportFolder: 'calendar-import',
    icsExportFolder: 'calendar-export',
    icsAutoImport: false,
  },
  canvas: {
    gridEnabled: false,
    gridSize: 20,
    snapToGrid: false,
    defaultZoom: 1,
    showMinimap: false,
  },
  graph: {
    viewMode: '2d',
    nodeRadius: 5,
    linkDistance: 80,
    repulsionForce: 500,
    centerGravity: 0.01,
    damping: 0.85,
    showLabels: false,
    labelThreshold: 20,
    nodeColor: '',
    edgeColor: '',
    edgeOpacity: 0.3,
  },
  highlighter: {
    highlighterColors: DEFAULT_HIGHLIGHTER_COLORS,
    highlighterMode: 'inline' as HighlighterMode,
    highlighterDefaultColor: 'Yellow',
  },
  pdf: {
    pdfHighlightColors: DEFAULT_PDF_HIGHLIGHT_COLORS,
    pdfDefaultHighlightColor: 'Yellow',
    pdfCopyTemplate: '{{linkWithDisplay}}',
    pdfDisplayTextFormat: '{{fileTitle}}, page {{page}}',
    pdfOpenSameTab: true,
    pdfSidebarDefault: 'none',
    pdfEmbedTrimSelection: true,
    pdfEmbedMargin: 50,
    pdfEmbedHideToolbar: false,
    pdfBacklinkHighlighting: true,
    pdfHighlightClearDelay: 0,
  },
  knowledge: {
    topicLinkingEnabled: true,
    topicLinkMinTitleLength: 3,
    topicLinkCaseSensitive: false,
    writingDailyGoal: 500,
    writingSprintDuration: 25,
    writingAutoSave: true,
  },
  gamification: {
    gamificationEnabled: true,
    showXpNotifications: true,
    showStreakReminders: true,
    enableAchievements: true,
    enableDailyChallenges: true,
    xpPerEdit: 2,
    xpPerCard: 5,
    xpPerNoteCreate: 8,
    xpPerTaskComplete: 10,
    xpPer100Words: 5,
    dailyLoginXp: 10,
    streakBonusXp: 15,
    streakBonusThreshold: 3,
  },
  window: {
    startFullscreen: false,
    restoreLastSize: true,
    restoreLastPosition: true,
    closeToTray: false,
    minimizeToTray: false,
  },
};
