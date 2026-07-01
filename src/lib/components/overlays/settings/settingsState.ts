/**
 * Settings modal state management.
 * Extracted from SettingsModal.svelte to reduce file size.
 */
import { get } from 'svelte/store';
import { settings, DEFAULT_SETTINGS } from '@/features/settings';

export interface SettingsFields {
  // General
  autoSave: boolean;
  autoSaveDelay: number;
  confirmBeforeDelete: boolean;
  defaultNoteLocation: string;
  dateFormat: string;
  timeFormat: string;
  newFileNameTemplate: string;
  language: string;
  autoCheckUpdates: boolean;
  updateChannel: 'alpha' | 'beta' | 'release';
  startupThresholdMs: number;
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
  // Typewriter
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
  nativeFrame: boolean;
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
  // Knowledge Versioning
  versioningEnabled: boolean;
  versionRetentionCount: number;
  versioningLlmClassify: boolean;
  // LLM Agent (Spec 040)
  llmEnabled: boolean;
  llmNoteContext: boolean;
  llmMaxHistory: number;
  // Voice Recorder (Spec 022)
  voiceFormat: 'webm' | 'ogg' | 'mp3';
  voiceQuality: 'low' | 'medium' | 'high';
  // Vim mode
  vimMode: boolean;
  vimrcPath: string;
  vimShowMode: boolean;
}

/** Load current settings values into form fields. */
export function loadFields(): SettingsFields {
  const s = get(settings);
  return {
    autoSave: s.autoSave,
    autoSaveDelay: s.autoSaveDelay,
    confirmBeforeDelete: s.confirmBeforeDelete,
    defaultNoteLocation: s.defaultNoteLocation,
    dateFormat: s.dateFormat,
    timeFormat: s.timeFormat,
    newFileNameTemplate: s.newFileNameTemplate,
    language: s.language,
    autoCheckUpdates: s.autoCheckUpdates,
    updateChannel: s.updateChannel,
    startupThresholdMs: s.startupThresholdMs,
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    showLineNumbers: s.showLineNumbers,
    wordWrap: s.wordWrap,
    hardLineBreaks: s.hardLineBreaks,
    spellCheck: s.spellCheck,
    tabSize: s.tabSize,
    insertSpaces: s.insertSpaces,
    trimTrailingWhitespace: s.trimTrailingWhitespace,
    livePreview: s.livePreview,
    livePreviewMode: s.livePreviewMode,
    closeBrackets: s.closeBrackets,
    typewriterEnabled: s.typewriterEnabled,
    typewriterOffset: s.typewriterOffset,
    typewriterOnlyKeyboard: s.typewriterOnlyKeyboard,
    zenModeEnabled: s.zenModeEnabled,
    zenModeVisibleLines: s.zenModeVisibleLines,
    zenModeDimOpacity: s.zenModeDimOpacity,
    accentColor: s.accentColor,
    showStatusBar: s.showStatusBar,
    compactMode: s.compactMode,
    nativeFrame: s.nativeFrame,
    activeThemePath: s.activeThemePath,
    fontInterface: s.fontInterface,
    fontText: s.fontText,
    fontMono: s.fontMono,
    enableGit: s.enableGit,
    autoCommit: s.autoCommit,
    syncOnStartup: s.syncOnStartup,
    commitMessageTemplate: s.commitMessageTemplate,
    enableBackups: s.enableBackups,
    changelogAutoUpdate: s.changelogAutoUpdate,
    changelogPath: s.changelogPath,
    changelogDatetimeFormat: s.changelogDatetimeFormat,
    changelogMaxFiles: s.changelogMaxFiles,
    changelogUseWikilinks: s.changelogUseWikilinks,
    changelogHeading: s.changelogHeading,
    changelogExcludedFolders: s.changelogExcludedFolders,
    versioningEnabled: s.versioningEnabled,
    versionRetentionCount: s.versionRetentionCount,
    versioningLlmClassify: s.versioningLlmClassify,
    llmEnabled: s.llmEnabled,
    llmNoteContext: s.llmNoteContext,
    llmMaxHistory: s.llmMaxHistory,
    voiceFormat: s.voiceFormat,
    voiceQuality: s.voiceQuality,
    vimMode: s.vimMode,
    vimrcPath: s.vimrcPath,
    vimShowMode: s.vimShowMode,
  };
}

/** Persist form fields to the settings store. */
export function saveFields(fields: SettingsFields): void {
  settings.update((current) => ({
    ...current,
    ...fields,
  }));
}

/** Reset all form fields to defaults, returns new field values. */
export function resetFields(): SettingsFields {
  settings.reset();
  return {
    autoSave: DEFAULT_SETTINGS.autoSave,
    autoSaveDelay: DEFAULT_SETTINGS.autoSaveDelay,
    confirmBeforeDelete: DEFAULT_SETTINGS.confirmBeforeDelete,
    defaultNoteLocation: DEFAULT_SETTINGS.defaultNoteLocation,
    dateFormat: DEFAULT_SETTINGS.dateFormat,
    timeFormat: DEFAULT_SETTINGS.timeFormat,
    newFileNameTemplate: DEFAULT_SETTINGS.newFileNameTemplate,
    language: DEFAULT_SETTINGS.language,
    autoCheckUpdates: DEFAULT_SETTINGS.autoCheckUpdates,
    updateChannel: DEFAULT_SETTINGS.updateChannel,
    startupThresholdMs: DEFAULT_SETTINGS.startupThresholdMs,
    fontSize: DEFAULT_SETTINGS.fontSize,
    lineHeight: DEFAULT_SETTINGS.lineHeight,
    showLineNumbers: DEFAULT_SETTINGS.showLineNumbers,
    wordWrap: DEFAULT_SETTINGS.wordWrap,
    hardLineBreaks: DEFAULT_SETTINGS.hardLineBreaks,
    spellCheck: DEFAULT_SETTINGS.spellCheck,
    tabSize: DEFAULT_SETTINGS.tabSize,
    insertSpaces: DEFAULT_SETTINGS.insertSpaces,
    trimTrailingWhitespace: DEFAULT_SETTINGS.trimTrailingWhitespace,
    livePreview: DEFAULT_SETTINGS.livePreview,
    livePreviewMode: DEFAULT_SETTINGS.livePreviewMode,
    closeBrackets: DEFAULT_SETTINGS.closeBrackets,
    typewriterEnabled: DEFAULT_SETTINGS.typewriterEnabled,
    typewriterOffset: DEFAULT_SETTINGS.typewriterOffset,
    typewriterOnlyKeyboard: DEFAULT_SETTINGS.typewriterOnlyKeyboard,
    zenModeEnabled: DEFAULT_SETTINGS.zenModeEnabled,
    zenModeVisibleLines: DEFAULT_SETTINGS.zenModeVisibleLines,
    zenModeDimOpacity: DEFAULT_SETTINGS.zenModeDimOpacity,
    accentColor: DEFAULT_SETTINGS.accentColor,
    showStatusBar: DEFAULT_SETTINGS.showStatusBar,
    compactMode: DEFAULT_SETTINGS.compactMode,
    nativeFrame: DEFAULT_SETTINGS.nativeFrame,
    activeThemePath: DEFAULT_SETTINGS.activeThemePath,
    fontInterface: DEFAULT_SETTINGS.fontInterface,
    fontText: DEFAULT_SETTINGS.fontText,
    fontMono: DEFAULT_SETTINGS.fontMono,
    enableGit: DEFAULT_SETTINGS.enableGit,
    autoCommit: DEFAULT_SETTINGS.autoCommit,
    syncOnStartup: DEFAULT_SETTINGS.syncOnStartup,
    commitMessageTemplate: DEFAULT_SETTINGS.commitMessageTemplate,
    enableBackups: DEFAULT_SETTINGS.enableBackups,
    changelogAutoUpdate: DEFAULT_SETTINGS.changelogAutoUpdate,
    changelogPath: DEFAULT_SETTINGS.changelogPath,
    changelogDatetimeFormat: DEFAULT_SETTINGS.changelogDatetimeFormat,
    changelogMaxFiles: DEFAULT_SETTINGS.changelogMaxFiles,
    changelogUseWikilinks: DEFAULT_SETTINGS.changelogUseWikilinks,
    changelogHeading: DEFAULT_SETTINGS.changelogHeading,
    changelogExcludedFolders: DEFAULT_SETTINGS.changelogExcludedFolders,
    versioningEnabled: DEFAULT_SETTINGS.versioningEnabled,
    versionRetentionCount: DEFAULT_SETTINGS.versionRetentionCount,
    versioningLlmClassify: DEFAULT_SETTINGS.versioningLlmClassify,
    llmEnabled: DEFAULT_SETTINGS.llmEnabled,
    llmNoteContext: DEFAULT_SETTINGS.llmNoteContext,
    llmMaxHistory: DEFAULT_SETTINGS.llmMaxHistory,
    voiceFormat: DEFAULT_SETTINGS.voiceFormat,
    voiceQuality: DEFAULT_SETTINGS.voiceQuality,
    vimMode: DEFAULT_SETTINGS.vimMode,
    vimrcPath: DEFAULT_SETTINGS.vimrcPath,
    vimShowMode: DEFAULT_SETTINGS.vimShowMode,
  };
}

export const HOTKEYS = [
  { action: 'New Note', key: '⌘N', editable: false },
  { action: 'Search', key: '⌘P', editable: false },
  { action: 'Toggle Sidebar', key: '⌘B', editable: false },
  { action: 'Delete Note', key: '⌘⌫', editable: false },
  { action: 'Save', key: '⌘S', editable: false },
  { action: 'Settings', key: '⌘,', editable: false },
];
