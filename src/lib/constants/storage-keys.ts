/**
 * Centralized localStorage / store key constants.
 * Every key that touches persistence lives here so renames are single-line diffs.
 */

// ── Core ────────────────────────────────────────────────────────
export const LAYOUT_KEY = 'bismuth-layout';
export const ZOOM_KEY = 'bismuth-zoom-level';
export const RECENT_FILES_KEY = 'bismuth-recent-files';
export const RECENT_VAULTS_KEY = 'bismuth-recent-vaults';
export const VAULT_INFO_KEY = 'bismuth-vault-info';
export const SETTINGS_STORE_KEY = 'settings';
export const SETTINGS_LS_KEY = 'bismuth-settings';
export const THEME_KEY = 'bismuth-theme';
export const LAST_ROUTE_KEY = 'bismuth-last-route';

// ── Navigator ──────────────────────────────────────────────────
export const BOOKMARKS_KEY = 'bismuth:bookmarks';

// ── Planner ─────────────────────────────────────────────────────
export const CALENDAR_EVENTS_KEY = 'bismuth:calendar-events';
export const CALENDAR_VIEW_KEY = 'bismuth:calendar-view';

// ── Projects ────────────────────────────────────────────────────
export const PROJECT_STATUSES_KEY = 'bismuth:project-statuses';
export const PM_TASKS_KEY = 'bismuth:pm-tasks';
export const PM_SETTINGS_KEY = 'bismuth:pm-settings';
export const PM_VIEW_KEY = 'bismuth:pm-view';

// ── Writing ─────────────────────────────────────────────────────
const WRITING_DAILY_GOAL_KEY = 'bismuth:writing-daily-goal';
const WRITING_SESSION_KEY = 'bismuth:writing-sessions';
export const WRITING_PROJECTS_KEY = 'bismuth:writing-projects';
export const WRITING_HISTORY_KEY = 'bismuth:writing-history';
export const WRITING_FOCUS_KEY = 'bismuth:writing-focus';

// ── Creative ────────────────────────────────────────────────────
export const CREATIVE_IDEAS_KEY = 'bismuth:creative-ideas';

// ── Canvas ─── (additional) ─────────────────────────────────────
export const CANVAS_LAYERS_KEY = 'bismuth:canvas-layers';
export const CANVAS_LIST_KEY = 'bismuth:canvas-list';
export const CANVAS_ACTIVE_KEY = 'bismuth:canvas-active';

// ── Editor ──────────────────────────────────────────────────────
export const EDITOR_TABS_KEY = 'bismuth:editor-tabs';

// ── Knowledge / Flashcards ─────────────────────────────────────
export const FLASHCARD_REVIEWS_KEY = 'bismuth:flashcard-reviews';
export const FLASHCARD_EVENTS_KEY = 'bismuth:flashcard-events';

// ── Wellness ───────────────────────────────────────────────────
export const MOOD_ENTRIES_KEY = 'bismuth:mood-entries';

// ── Gamification ──────────────────────────────────────────────
export const GAMIFICATION_KEY = 'bismuth:gamification';

// ── Topic Linking ────────────────────────────────────────────
export const TOPIC_LINK_IGNORE_KEY = 'bismuth:topic-link-ignore';

// ── NAS Backup ─────────────────────────────────────────────────
export const NAS_BACKUP_META_KEY = 'bismuth:nas-backup-meta';

// ── Hotkeys ───────────────────────────────────────────────────
export const HOTKEY_OVERRIDES_KEY = 'bismuth:hotkey-overrides';
export const CUSTOM_HOTKEYS_KEY = 'bismuth:custom-hotkeys';
