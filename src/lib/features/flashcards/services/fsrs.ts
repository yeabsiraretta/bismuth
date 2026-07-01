/**
 * FSRS (Free Spaced Repetition Scheduler) algorithm implementation.
 * Based on the open-source FSRS-4.5 algorithm by Jarrett Ye.
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki
 *
 * FSRS models memory with two variables:
 * - Stability (S): expected interval at 90% retention
 * - Difficulty (D): intrinsic difficulty of a card (1-10)
 */

import type { ReviewGrade } from './scheduler';

// ─── FSRS State ─────────────────────────────────────────────────────────────

export interface FSRSState {
  stability: number;
  difficulty: number;
  lastReview: string;
  reps: number;
  lapses: number;
}

// ─── Default Parameters (FSRS-4.5 defaults) ────────────────────────────────

const W = [
  0.4, 0.6, 2.4, 5.8,   // w0-w3: initial stability for Again/Hard/Good/Easy
  4.93, 0.94, 0.86, 0.01, // w4-w7: difficulty params
  1.49, 0.14, 0.94,       // w8-w10: stability after recall
  2.18, 0.05, 0.34, 1.26, // w11-w14: stability after forgetting
  0.29, 2.61,              // w15-w16: hard/easy penalty/bonus
];

const DESIRED_RETENTION = 0.9;

// ─── Core Functions ─────────────────────────────────────────────────────────

/** Map SM-2 grade (0-5) to FSRS rating (1-4: Again/Hard/Good/Easy). */
function gradeToRating(grade: ReviewGrade): number {
  if (grade <= 1) return 1; // Again
  if (grade === 2) return 2; // Hard
  if (grade <= 4) return 3; // Good
  return 4; // Easy
}

/** Initial stability for a new card based on first rating. */
function initStability(rating: number): number {
  return Math.max(W[rating - 1], 0.1);
}

/** Initial difficulty based on first rating. */
function initDifficulty(rating: number): number {
  return clampDifficulty(W[4] - (rating - 3) * W[5]);
}

/** Update difficulty after a review. */
function nextDifficulty(d: number, rating: number): number {
  const deltaDifficulty = -W[6] * (rating - 3);
  const meanReversion = W[7] * (W[4] - d);
  return clampDifficulty(d + deltaDifficulty + meanReversion);
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

/** Stability after successful recall. */
function nextRecallStability(d: number, s: number, r: number, rating: number): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  return s * (
    1 + Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp((1 - r) * W[10]) - 1) *
    hardPenalty *
    easyBonus
  );
}

/** Stability after a lapse (forgetting). */
function nextForgetStability(d: number, s: number, r: number): number {
  return Math.max(
    0.1,
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp((1 - r) * W[14])
  );
}

/** Calculate retrievability (probability of recall) given elapsed days. */
function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

/** Calculate next interval from stability and desired retention. */
function nextInterval(stability: number): number {
  const interval = 9 * stability * (1 / DESIRED_RETENTION - 1);
  return Math.max(1, Math.min(36500, Math.round(interval)));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Grade a card using FSRS. Returns updated state and next interval. */
export function fsrsGrade(
  state: FSRSState | null,
  grade: ReviewGrade,
): { state: FSRSState; intervalDays: number } {
  const rating = gradeToRating(grade);
  const now = new Date();

  if (!state || state.reps === 0) {
    // First review — initialize
    const s = initStability(rating);
    const d = initDifficulty(rating);
    return {
      state: {
        stability: s,
        difficulty: d,
        lastReview: now.toISOString(),
        reps: 1,
        lapses: rating === 1 ? 1 : 0,
      },
      intervalDays: nextInterval(s),
    };
  }

  // Subsequent review
  const elapsedDays = Math.max(0,
    (now.getTime() - new Date(state.lastReview).getTime()) / 86400000
  );
  const r = retrievability(elapsedDays, state.stability);
  const d = nextDifficulty(state.difficulty, rating);

  let s: number;
  let lapses = state.lapses;
  if (rating === 1) {
    // Forgot — lapse
    s = nextForgetStability(d, state.stability, r);
    lapses++;
  } else {
    // Recalled
    s = nextRecallStability(d, state.stability, r, rating);
  }

  return {
    state: {
      stability: s,
      difficulty: d,
      lastReview: now.toISOString(),
      reps: state.reps + 1,
      lapses,
    },
    intervalDays: nextInterval(s),
  };
}

/** Get current retrievability for display purposes. */
export function getRetrievability(state: FSRSState): number {
  const elapsed = (Date.now() - new Date(state.lastReview).getTime()) / 86400000;
  return retrievability(elapsed, state.stability);
}
