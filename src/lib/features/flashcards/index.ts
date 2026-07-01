/**
 * Flashcard feature public API.
 * External consumers import ONLY from this path.
 */

export { default as FlashcardPanel } from './components/FlashcardPanel.svelte';
export { default as FlashcardIndicator } from './components/FlashcardIndicator.svelte';
export { default as StudySession } from './components/StudySession.svelte';
export { default as CoursePanel } from './components/CoursePanel.svelte';
export { default as ExamProgressView } from './components/ExamProgressView.svelte';
export { default as VaultFlashcardPanel } from './components/viewer/VaultFlashcardPanel.svelte';
export { default as NoteReviewQueue } from './components/review/NoteReviewQueue.svelte';
export { default as DeckBrowser } from './components/review/DeckBrowser.svelte';
export { default as StatsPanel } from './components/review/StatsPanel.svelte';

export {
  scanActiveNote,
  scanNote,
  scanCourse,
  syncToAnki,
  pingAnki,
  clearCards,
  importCardsFromAnki,
  scannedCards,
  cardCount,
  connectionStatus,
  isSyncing,
  isScanning,
  lastSyncResult,
  flashcardError,
} from './stores/flashcardStore';

export {
  courses,
  activeCourse,
  courseProgress,
  courseTopics,
  loadCourses,
  saveCourseAction,
  deleteCourseAction,
  setActiveCourse,
  markTopicMastered,
} from './stores/courseStore';

export {
  gradeCard,
  getDueCards,
  getCardsInDeck,
  buildDeckTree,
  computeStats,
  gradeCardWithAlgorithm,
  gradeNoteReview,
  createReviewableNote,
  serializeRecords,
  deserializeRecords,
  serializeEvents,
  deserializeEvents,
  serializeNoteReviews,
  deserializeNoteReviews,
} from './services/scheduler';

export { fsrsGrade, getRetrievability } from './services/fsrs';
export type { FSRSState } from './services/fsrs';

export { parseFlashcards } from './services/parser';
export { parseAllCards, parseStudyVaultCards, parsePracticeQuestions } from './services/studyParser';
export type { AnkiImportedNote } from './services/ankiConnect';

export type {
  Flashcard,
  FlashcardType,
  NoteFlashcards,
  SyncResult,
  AnkiConnectionStatus,
  SchedulerAlgorithm,
  ReviewableNote,
  NoteRecallRating,
  DeckNode,
  FlashcardStats,
  ReviewEvent,
} from './types/flashcard';

export type {
  Course,
  CourseStatus,
  TopicMastery,
  CourseProgress,
  PracticeQuestion,
  ExamSession,
} from './types/course';

export type { ReviewRecord, ReviewGrade } from './services/scheduler';

// Cloze
export type {
  ClozeConfig,
  ClozeAutoConvert,
  ClozeHintConfig,
  ClozeHintMode,
} from './types/cloze';
export { DEFAULT_CLOZE_CONFIG } from './types/cloze';

export {
  findClozes,
  wrapCloze,
  unwrapClozes,
  generateHint,
  noteHasTag,
  getClozeBlank,
} from './services/clozeService';
export type { ClozeMatch } from './services/clozeService';

export {
  clozeConfig,
  updateClozeConfig,
  resetClozeConfig,
  getClozeConfig,
  toggleAllClozes,
  setAllClozesRevealed,
  toggleHoverReveal,
  toggleFixedWidth,
  toggleClozeEnabled,
} from './stores/clozeStore';

export { clozeExtension } from './services/clozeExtension';

export { FlashcardWidget, ClozeWidget } from './services/flashcardWidget';
