import type { CalendarCategory } from '@/features/calendar';
import { DEFAULT_CALENDAR_CATEGORIES } from '@/features/calendar';

export interface BismuthSettings {
  // General
  autoSave: boolean;
  autoSaveDelay: number;
  confirmBeforeDelete: boolean;
  defaultNoteLocation: string;
  dateFormat: string;
  timeFormat: string;
  newFileNameTemplate: string;

  // Language
  language: string;

  // Updates
  autoCheckUpdates: boolean;
  lastUpdateCheck: number;
  updateChannel: 'alpha' | 'beta' | 'release';

  // Performance
  startupThresholdMs: number;

  // Calendar
  calendarCategories: CalendarCategory[];

  // Editor
  fontSize: number;
  lineHeight: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  hardLineBreaks: boolean;
  spellCheck: boolean;
  tabSize: number;
  insertSpaces: boolean;
  trimTrailingWhitespace: boolean;
  livePreview: boolean;
  livePreviewMode: 'source' | 'live' | 'reading';
  closeBrackets: boolean;
  floatingToolbar: boolean;

  // Typewriter scroll
  typewriterEnabled: boolean;
  typewriterOffset: number;
  typewriterOnlyKeyboard: boolean;
  zenModeEnabled: boolean;
  zenModeVisibleLines: number;
  zenModeDimOpacity: number;

  // Appearance
  accentColor: string;
  showStatusBar: boolean;
  compactMode: boolean;
  activeThemePath: string;

  // Fonts
  fontInterface: string;
  fontText: string;
  fontMono: string;

  // Vault
  enableGit: boolean;
  autoCommit: boolean;
  syncOnStartup: boolean;
  commitMessageTemplate: string;
  enableBackups: boolean;

  // Changelog
  changelogAutoUpdate: boolean;
  changelogPath: string;
  changelogDatetimeFormat: string;
  changelogMaxFiles: number;
  changelogUseWikilinks: boolean;
  changelogHeading: string;
  changelogExcludedFolders: string;

  // Window
  nativeFrame: boolean;

  // Knowledge Versioning (spec 051)
  versioningEnabled: boolean;
  versionRetentionCount: number;
  versioningLlmClassify: boolean;

  // Music (Spec 039)
  musicEnabled: boolean;

  // OCR (Spec 038)
  ocrEnabled: boolean;
  ocrDefaultLanguage: string;
  ocrLlmCorrection: boolean;
  ocrLlmCloudEnabled: boolean;
  ocrModelPath: string;
  ocrAmharicModelPath: string;

  // LLM Agent Access (Spec 040)
  llmEnabled: boolean;
  llmNoteContext: boolean;
  llmMaxHistory: number;

  // NAS Access (Spec 050)
  nasEnabled: boolean;

  // Voice Recorder (Spec 022)
  voiceFormat: 'webm' | 'ogg' | 'mp3';
  voiceQuality: 'low' | 'medium' | 'high';

  // Flashcards / Anki integration
  flashcardsEnabled: boolean;
  ankiConnectPort: number;
  ankiDeckPrefix: string;
  flashcardsAutoScan: boolean;

  // Vim mode
  vimMode: boolean;
  vimrcPath: string;
  vimShowMode: boolean;
}

export const DEFAULT_SETTINGS: BismuthSettings = {
  autoSave: true,
  autoSaveDelay: 500,
  confirmBeforeDelete: true,
  defaultNoteLocation: '',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  newFileNameTemplate: 'Untitled',
  language: 'en',
  autoCheckUpdates: false,
  lastUpdateCheck: 0,
  updateChannel: 'release',
  startupThresholdMs: 4000,
  calendarCategories: DEFAULT_CALENDAR_CATEGORIES,
  fontSize: 16,
  lineHeight: 1.6,
  showLineNumbers: false,
  wordWrap: true,
  hardLineBreaks: false,
  spellCheck: true,
  tabSize: 2,
  insertSpaces: true,
  trimTrailingWhitespace: true,
  livePreview: false,
  livePreviewMode: 'source',
  closeBrackets: true,
  floatingToolbar: true,
  typewriterEnabled: false,
  typewriterOffset: 0.5,
  typewriterOnlyKeyboard: true,
  zenModeEnabled: false,
  zenModeVisibleLines: 5,
  zenModeDimOpacity: 0.25,
  accentColor: '#dc2626',
  showStatusBar: true,
  compactMode: false,
  activeThemePath: '',
  fontInterface: 'Inter Variable',
  fontText: 'Inter Variable',
  fontMono: 'JetBrains Mono',
  enableGit: false,
  autoCommit: false,
  syncOnStartup: false,
  commitMessageTemplate: 'Update [filename]',
  enableBackups: false,
  changelogAutoUpdate: false,
  changelogPath: 'Changelog.md',
  changelogDatetimeFormat: 'YYYY-MM-DDTHH:mm',
  changelogMaxFiles: 25,
  changelogUseWikilinks: true,
  changelogHeading: '',
  changelogExcludedFolders: '',
  nativeFrame: false,
  versioningEnabled: false,
  versionRetentionCount: 50,
  versioningLlmClassify: false,
  musicEnabled: false,
  ocrEnabled: false,
  ocrDefaultLanguage: 'en',
  ocrLlmCorrection: false,
  ocrLlmCloudEnabled: false,
  ocrModelPath: '',
  ocrAmharicModelPath: '',
  llmEnabled: false,
  llmNoteContext: false,
  llmMaxHistory: 20,
  nasEnabled: false,
  voiceFormat: 'webm',
  voiceQuality: 'medium',
  flashcardsEnabled: false,
  ankiConnectPort: 8765,
  ankiDeckPrefix: 'Bismuth',
  flashcardsAutoScan: true,
  vimMode: false,
  vimrcPath: '.obsidian.vimrc',
  vimShowMode: true,
};
