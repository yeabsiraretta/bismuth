/**
 * Flashcard types — cards, decks, sync state, and Anki note models.
 * Aligned with AnkiConnect API v6 field structure.
 * Extended with Obsidian SR plugin compatibility.
 */

/** Supported Anki note types (maps to default Anki note models). */
export type FlashcardType =
  | 'basic' // Front --- Back
  | 'basic-reversed' // Front --- --- Back (two cards)
  | 'multiline' // Question ? Answer (SR-style)
  | 'multiline-reversed' // Question ?? Answer (SR-style)
  | 'cloze'; // ==highlight==, {curly}, or **bold** deletions

/** Which spaced repetition algorithm to use. */
export type SchedulerAlgorithm = 'sm2' | 'fsrs';

/** A single parsed flashcard from note content. */
export interface Flashcard {
  /** Stable hash of the source block — used as idempotency key. */
  id: string;
  type: FlashcardType;
  /** Front of card (or full cloze template). */
  front: string;
  /** Back of card (undefined for cloze). */
  back?: string;
  /** Tags from note frontmatter merged with inline #card tags. */
  tags: string[];
  /** Anki deck path e.g. "Bismuth::Notes". Derived from note folder hierarchy. */
  deck: string;
  /** Source note path. */
  sourcePath: string;
  /** Line number in source where this card starts. */
  sourceLine: number;
  /** Anki note ID after first successful sync (null = not yet synced). */
  ankiNoteId: number | null;
  /** Heading breadcrumb context e.g. "Note title > Heading 1 > Subheading". */
  context?: string;
}

/** Parsed result from a single note scan. */
export interface NoteFlashcards {
  notePath: string;
  cards: Flashcard[];
  /** Whether at least one `#card` / `::` marker was found. */
  hasCards: boolean;
}

/** Per-card sync outcome. */
export interface CardSyncResult {
  cardId: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  ankiNoteId?: number;
  error?: string;
}

/** Top-level sync operation result. */
export interface SyncResult {
  syncedAt: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: CardSyncResult[];
}

/** AnkiConnect connection status. */
export type AnkiConnectionStatus = 'unknown' | 'connected' | 'unreachable' | 'permission-denied';

/** Flashcard feature store state. */
export interface FlashcardState {
  connectionStatus: AnkiConnectionStatus;
  lastSyncAt: string | null;
  lastSyncResult: SyncResult | null;
  syncing: boolean;
  scanning: boolean;
  scannedCards: Flashcard[];
  error: string | null;
}

// ─── Note Review (SR-style) ─────────────────────────────────────────────────

/** A note marked for spaced repetition review via #review tag. */
export interface ReviewableNote {
  path: string;
  title: string;
  /** ISO date string for next review. */
  nextReview: string;
  /** Current interval in days. */
  intervalDays: number;
  /** Ease factor (SM-2) or stability (FSRS). */
  easeFactor: number;
  /** Total number of reviews. */
  reviewCount: number;
  lastReviewed: string;
}

/** Note recall rating — simplified from card grades. */
export type NoteRecallRating = 'forgot' | 'hard' | 'good' | 'easy';

// ─── Deck Browser ────────────────────────────────────────────────────────────

/** A deck node in the hierarchical deck tree. */
export interface DeckNode {
  name: string;
  fullPath: string;
  cardCount: number;
  dueCount: number;
  children: DeckNode[];
}

// ─── Statistics ──────────────────────────────────────────────────────────────

/** A single review event for statistics tracking. */
export interface ReviewEvent {
  cardId: string;
  grade: number;
  timestamp: string;
  intervalDays: number;
  algorithm: SchedulerAlgorithm;
}

/** Aggregated statistics snapshot. */
export interface FlashcardStats {
  totalCards: number;
  totalReviews: number;
  reviewsToday: number;
  currentStreak: number;
  longestStreak: number;
  retentionRate: number;
  maturedCards: number;
  newCards: number;
  youngCards: number;
}
