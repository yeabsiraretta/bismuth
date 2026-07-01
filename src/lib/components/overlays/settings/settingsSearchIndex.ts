/**
 * Settings search index — maps every searchable setting to its tab, group, and keywords.
 * Used by SettingsSidebar search to filter and navigate settings across all tabs.
 */
import type { SettingsTab } from './settingsTabRouter';

export interface SettingsEntry {
  id: string;
  tab: SettingsTab;
  group: string;
  label: string;
  description: string;
  keywords: string[];
}

export interface SearchResult extends SettingsEntry {
  /** Match score (lower = better) */
  score: number;
}

// ── Search index ──────────────────────────────────────────────────────────────
const SETTINGS_INDEX: SettingsEntry[] = [
  // General
  { id: 'gen-lang', tab: 'general', group: 'Language', label: 'App Language', description: 'Interface display language', keywords: ['locale', 'i18n'] },
  { id: 'gen-updates', tab: 'general', group: 'Updates', label: 'Check for updates on startup', description: 'Silently checks for available updates when Bismuth opens', keywords: ['auto update'] },
  { id: 'gen-channel', tab: 'general', group: 'Updates', label: 'Update channel', description: 'Which releases to check for (release, beta, alpha)', keywords: ['stable', 'alpha', 'beta'] },
  { id: 'gen-perf', tab: 'general', group: 'Performance', label: 'Slow startup threshold', description: 'Show a notification if startup takes longer than this', keywords: ['speed', 'ms', 'threshold'] },
  { id: 'gen-location', tab: 'general', group: 'File Management', label: 'Default Note Location', description: 'Folder path where new notes are created', keywords: ['path', 'folder', 'default'] },
  { id: 'gen-confirm', tab: 'general', group: 'File Management', label: 'Confirm before deleting notes', description: 'Show confirmation dialog when deleting notes', keywords: ['delete', 'trash'] },
  { id: 'gen-template', tab: 'general', group: 'File Management', label: 'New File Name Template', description: 'Template for naming new notes', keywords: ['filename', 'naming', 'date'] },
  { id: 'gen-autosave', tab: 'general', group: 'Auto-Save', label: 'Enable auto-save', description: 'Automatically save notes as you type', keywords: ['save', 'auto'] },
  { id: 'gen-savedelay', tab: 'general', group: 'Auto-Save', label: 'Auto-save delay', description: 'Time to wait after typing before saving', keywords: ['debounce', 'ms'] },
  { id: 'gen-date', tab: 'general', group: 'Date & Time', label: 'Date Format', description: 'Format for displaying dates', keywords: ['YYYY', 'MM', 'DD'] },
  { id: 'gen-time', tab: 'general', group: 'Date & Time', label: 'Time Format', description: '12-hour or 24-hour clock', keywords: ['12h', '24h', 'clock'] },
  { id: 'gen-homepage', tab: 'general', group: 'Homepage', label: 'On startup, open', description: 'Choose what to show when you open the vault', keywords: ['startup', 'launch', 'daily note'] },

  // Editor
  { id: 'ed-fontsize', tab: 'editor', group: 'Typography', label: 'Font Size', description: 'Base font size for the editor text', keywords: ['px', 'text size'] },
  { id: 'ed-lineheight', tab: 'editor', group: 'Typography', label: 'Line Height', description: 'Spacing between lines of text', keywords: ['leading', 'spacing'] },
  { id: 'ed-linenums', tab: 'editor', group: 'Editor Behavior', label: 'Show line numbers', description: 'Display line numbers in the editor gutter', keywords: ['gutter'] },
  { id: 'ed-wordwrap', tab: 'editor', group: 'Editor Behavior', label: 'Word wrap', description: 'Wrap long lines to fit the editor width', keywords: ['wrapping', 'overflow'] },
  { id: 'ed-spellcheck', tab: 'editor', group: 'Editor Behavior', label: 'Spell check', description: 'Enable browser spell checking in the editor', keywords: ['spelling', 'grammar'] },
  { id: 'ed-trimws', tab: 'editor', group: 'Editor Behavior', label: 'Trim trailing whitespace', description: 'Remove extra spaces at end of lines when saving', keywords: ['whitespace', 'cleanup'] },
  { id: 'ed-brackets', tab: 'editor', group: 'Editor Behavior', label: 'Auto-close brackets', description: 'Automatically close brackets and quotes', keywords: ['pair', 'matching'] },
  { id: 'ed-tabsize', tab: 'editor', group: 'Indentation', label: 'Tab Size', description: 'Number of spaces per tab', keywords: ['indent', 'spaces'] },
  { id: 'ed-spaces', tab: 'editor', group: 'Indentation', label: 'Insert spaces instead of tabs', description: 'Use spaces when pressing Tab key', keywords: ['soft tab'] },
  { id: 'ed-preview', tab: 'editor', group: 'Markdown', label: 'Live preview', description: 'Hide markdown syntax and reveal on hover/cursor', keywords: ['wysiwyg', 'render'] },
  { id: 'ed-previewmode', tab: 'editor', group: 'Markdown', label: 'Preview mode', description: 'Controls how Markdown is rendered (source, live, reading)', keywords: ['source', 'reading'] },
  { id: 'ed-hardbreaks', tab: 'editor', group: 'Markdown', label: 'Hard line breaks', description: 'Render single newlines as line breaks', keywords: ['newline', 'br'] },
  { id: 'ed-typewriter', tab: 'editor', group: 'Typewriter Scroll', label: 'Enable typewriter scroll', description: 'Center the active line while typing or navigating', keywords: ['focus', 'scroll'] },
  { id: 'ed-twoffset', tab: 'editor', group: 'Typewriter Scroll', label: 'Scroll position', description: 'Vertical position for the cursor line', keywords: ['center', 'offset'] },
  { id: 'ed-twkeyboard', tab: 'editor', group: 'Typewriter Scroll', label: 'Keyboard only', description: 'Only scroll on keyboard input, not mouse clicks', keywords: ['mouse'] },
  { id: 'ed-zen', tab: 'editor', group: 'Zen Mode', label: 'Enable zen mode', description: 'Dim non-active lines in the editor', keywords: ['focus', 'distraction'] },
  { id: 'ed-zenlines', tab: 'editor', group: 'Zen Mode', label: 'Visible lines', description: 'Lines above and below the cursor that stay fully visible', keywords: ['radius'] },
  { id: 'ed-zenopacity', tab: 'editor', group: 'Zen Mode', label: 'Dim opacity', description: 'Opacity for dimmed lines', keywords: ['fade', 'transparency'] },

  // Appearance
  { id: 'app-theme', tab: 'appearance', group: 'Theme', label: 'Theme Mode', description: 'Switch between light, dark, and auto (system) theme', keywords: ['dark mode', 'light mode'] },
  { id: 'app-accent', tab: 'appearance', group: 'Theme', label: 'Accent Color', description: 'Primary color for buttons and highlights', keywords: ['color', 'tint'] },
  { id: 'app-status', tab: 'appearance', group: 'Interface', label: 'Show status bar', description: 'Display status information at the bottom', keywords: ['footer', 'bar'] },
  { id: 'app-compact', tab: 'appearance', group: 'Interface', label: 'Compact mode', description: 'Reduce spacing for more content on screen', keywords: ['dense', 'padding'] },
  { id: 'app-native', tab: 'appearance', group: 'Interface', label: 'Native window frame', description: 'Use system window decorations (restart required)', keywords: ['titlebar', 'window'] },
  { id: 'app-scale', tab: 'appearance', group: 'UI Scale', label: 'Scale', description: 'Scale all UI components uniformly (75%-150%)', keywords: ['zoom', 'size'] },
  { id: 'app-fontui', tab: 'appearance', group: 'Fonts', label: 'Interface Font', description: 'Font for UI elements (sidebars, panels, menus)', keywords: ['typeface', 'sans'] },
  { id: 'app-fonttext', tab: 'appearance', group: 'Fonts', label: 'Text / Editor Font', description: 'Font for note content and the editor', keywords: ['typeface', 'serif'] },
  { id: 'app-fontmono', tab: 'appearance', group: 'Fonts', label: 'Monospace Font', description: 'Font for code blocks and monospace content', keywords: ['code font', 'mono'] },
  { id: 'app-themestore', tab: 'appearance', group: 'Theme Store', label: 'Theme Browser', description: 'Browse and install community themes', keywords: ['install', 'community'] },

  // Features
  { id: 'feat-toggles', tab: 'features', group: 'Feature Flags', label: 'Feature Toggles', description: 'Enable or disable optional features', keywords: ['toggle', 'enable', 'disable', 'plugin'] },

  // AI Agent
  { id: 'llm-enable', tab: 'llm', group: 'Enable', label: 'Enable AI agent', description: 'Activates the LLM-powered agent panel', keywords: ['ai', 'chatbot', 'assistant'] },
  { id: 'llm-provider', tab: 'llm', group: 'Provider', label: 'LLM provider', description: 'Ollama (local) or Claude (Anthropic)', keywords: ['ollama', 'claude', 'anthropic'] },
  { id: 'llm-url', tab: 'llm', group: 'Ollama', label: 'Server URL', description: 'Base URL of your running Ollama instance', keywords: ['endpoint', 'localhost'] },
  { id: 'llm-model', tab: 'llm', group: 'Ollama', label: 'Model name', description: 'Ollama model tag (e.g. llama3.2)', keywords: ['llama', 'model'] },
  { id: 'llm-tokens', tab: 'llm', group: 'Response', label: 'Max tokens', description: 'Maximum tokens in each LLM response', keywords: ['length', 'limit'] },
  { id: 'llm-context', tab: 'llm', group: 'Context', label: 'Include current note as context', description: 'Sends the active note content to the agent', keywords: ['note context'] },
  { id: 'llm-history', tab: 'llm', group: 'Context', label: 'Max history', description: 'Number of previous messages sent as context', keywords: ['memory', 'conversation'] },

  // Vault
  { id: 'v-name', tab: 'vault', group: 'Current Vault', label: 'Vault Name', description: 'Display name for this vault', keywords: ['rename'] },
  { id: 'v-path', tab: 'vault', group: 'Current Vault', label: 'Vault Path', description: 'Location of vault on your file system', keywords: ['folder', 'directory'] },
  { id: 'v-git', tab: 'vault', group: 'Version Control', label: 'Enable Git integration', description: 'Track changes with Git version control', keywords: ['git', 'vcs'] },
  { id: 'v-autocommit', tab: 'vault', group: 'Version Control', label: 'Auto-commit changes', description: 'Automatically commit after saving notes', keywords: ['git commit'] },
  { id: 'v-sync', tab: 'vault', group: 'Version Control', label: 'Sync on startup', description: 'Pull latest changes when opening vault', keywords: ['git pull'] },
  { id: 'v-commitmsg', tab: 'vault', group: 'Version Control', label: 'Commit Message Template', description: 'Template for auto-commit messages', keywords: ['message'] },
  { id: 'v-backup', tab: 'vault', group: 'Backup & Sync', label: 'Enable automatic backups', description: 'Create periodic backups of your vault', keywords: ['snapshot'] },
  { id: 'v-versioning', tab: 'vault', group: 'Knowledge Versioning', label: 'Enable version history', description: 'Save a diff snapshot on each note save', keywords: ['diff', 'history'] },
  { id: 'v-retention', tab: 'vault', group: 'Knowledge Versioning', label: 'Retention count', description: 'Maximum version snapshots kept per note', keywords: ['limit', 'prune'] },
  { id: 'v-llmclass', tab: 'vault', group: 'Knowledge Versioning', label: 'LLM bump classification', description: 'Use AI to classify semver bump type', keywords: ['semver', 'ai'] },

  // Embeddings
  { id: 'emb-status', tab: 'embeddings', group: 'Index Status', label: 'Embedding Index', description: 'Semantic search uses local vector embeddings', keywords: ['vector', 'semantic', 'similarity'] },
  { id: 'emb-reindex', tab: 'embeddings', group: 'Actions', label: 'Re-index All Notes', description: 'Process all vault notes for semantic search', keywords: ['rebuild', 'index'] },

  // Changelog
  { id: 'cl-auto', tab: 'changelog', group: 'Behavior', label: 'Auto-update changelog', description: 'Append entries when notes are created or modified', keywords: ['auto'] },
  { id: 'cl-wiki', tab: 'changelog', group: 'Behavior', label: 'Use wikilinks for note names', description: 'Wrap note names in [[ ]] instead of plain text', keywords: ['link'] },
  { id: 'cl-path', tab: 'changelog', group: 'File', label: 'Changelog file path', description: 'Path relative to vault root for changelog entries', keywords: ['filename'] },
  { id: 'cl-heading', tab: 'changelog', group: 'File', label: 'Heading text', description: 'Section heading inserted before each entry group', keywords: ['header'] },
  { id: 'cl-max', tab: 'changelog', group: 'File', label: 'Max entries', description: 'Maximum number of entries to keep', keywords: ['limit'] },
  { id: 'cl-datetime', tab: 'changelog', group: 'Format', label: 'Date/time format', description: 'Moment.js-compatible format string', keywords: ['timestamp'] },
  { id: 'cl-exclude', tab: 'changelog', group: 'Format', label: 'Excluded folders', description: 'Comma-separated folder paths to ignore', keywords: ['filter', 'ignore'] },

  // Voice
  { id: 'voice-fmt', tab: 'voice', group: 'Recording Format', label: 'Audio format', description: 'Container format for recorded audio (WebM, OGG, MP3)', keywords: ['codec', 'recording'] },
  { id: 'voice-qual', tab: 'voice', group: 'Recording Quality', label: 'Quality', description: 'Recording bitrate (64-256 kbps)', keywords: ['bitrate', 'kbps'] },

  // Hotkeys
  { id: 'hk-shortcuts', tab: 'hotkeys', group: 'Keyboard Shortcuts', label: 'Hotkeys', description: 'View and customise keyboard shortcuts', keywords: ['keybind', 'shortcut', 'command'] },
];

// ── Search logic ──────────────────────────────────────────────────────────────

/** Normalise a string for matching (lowercase, collapse whitespace). */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Score a single entry against a query. Lower = better. Returns -1 for no match. */
function scoreEntry(entry: SettingsEntry, query: string): number {
  const q = norm(query);
  if (!q) return -1;

  const label = norm(entry.label);
  const desc = norm(entry.description);
  const group = norm(entry.group);
  const kw = entry.keywords.map(norm);

  // Exact label match
  if (label === q) return 0;
  // Label starts with query
  if (label.startsWith(q)) return 1;
  // Label contains query
  if (label.includes(q)) return 2;
  // Group contains query
  if (group.includes(q)) return 3;
  // Description contains query
  if (desc.includes(q)) return 4;
  // Keywords contain query
  if (kw.some((k) => k.includes(q))) return 5;
  // Word-level: any query word matches
  const words = q.split(' ').filter(Boolean);
  const allText = `${label} ${desc} ${group} ${kw.join(' ')}`;
  if (words.length > 1 && words.every((w) => allText.includes(w))) return 6;

  return -1;
}

/** Search the settings index. Returns scored results sorted by relevance. */
export function searchSettings(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];
  for (const entry of SETTINGS_INDEX) {
    const score = scoreEntry(entry, query);
    if (score >= 0) results.push({ ...entry, score });
  }

  return results.sort((a, b) => a.score - b.score || a.label.localeCompare(b.label));
}

/** Get all tabs that have at least one matching result. */
export function matchingTabs(query: string): Set<SettingsTab> {
  const results = searchSettings(query);
  return new Set(results.map((r) => r.tab));
}

/** Group search results by tab. */
export function groupByTab(results: SearchResult[]): Map<SettingsTab, SearchResult[]> {
  const groups = new Map<SettingsTab, SearchResult[]>();
  for (const r of results) {
    const list = groups.get(r.tab) ?? [];
    list.push(r);
    groups.set(r.tab, list);
  }
  return groups;
}

export { SETTINGS_INDEX };
