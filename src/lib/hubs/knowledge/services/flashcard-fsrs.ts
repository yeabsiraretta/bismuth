/**
 * FSRS (Free Spaced Repetition Scheduler) algorithm — FSRS-4.5.
 * Based on https://github.com/open-spaced-repetition/fsrs4anki
 * Ported from v1 fsrs.ts.
 */

import type { FSRSState, ReviewGrade } from '@/hubs/knowledge/types/flashcard-types';

const W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
];

const DESIRED_RETENTION = 0.9;

function gradeToRating(grade: ReviewGrade): number {
  if (grade <= 1) return 1;
  if (grade === 2) return 2;
  if (grade <= 4) return 3;
  return 4;
}

function initStability(rating: number): number {
  return Math.max(W[rating - 1], 0.1);
}

function initDifficulty(rating: number): number {
  return clampDifficulty(W[4] - (rating - 3) * W[5]);
}

function nextDifficulty(d: number, rating: number): number {
  return clampDifficulty(d + -W[6] * (rating - 3) + W[7] * (W[4] - d));
}

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, d));
}

function nextRecallStability(d: number, s: number, r: number, rating: number): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  return (
    s *
    (1 +
      Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp((1 - r) * W[10]) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function nextForgetStability(d: number, s: number, r: number): number {
  return Math.max(
    0.1,
    W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14])
  );
}

function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

function nextInterval(stability: number): number {
  return Math.max(1, Math.min(36500, Math.round(9 * stability * (1 / DESIRED_RETENTION - 1))));
}

export function fsrsGrade(
  state: FSRSState | null,
  grade: ReviewGrade
): { state: FSRSState; intervalDays: number } {
  const rating = gradeToRating(grade);
  const now = new Date();

  if (!state || state.reps === 0) {
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

  const elapsedDays = Math.max(
    0,
    (now.getTime() - new Date(state.lastReview).getTime()) / 86400000
  );
  const r = retrievability(elapsedDays, state.stability);
  const d = nextDifficulty(state.difficulty, rating);
  let s: number;
  let lapses = state.lapses;

  if (rating === 1) {
    s = nextForgetStability(d, state.stability, r);
    lapses++;
  } else {
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

function getRetrievability(state: FSRSState): number {
  const elapsed = (Date.now() - new Date(state.lastReview).getTime()) / 86400000;
  return retrievability(elapsed, state.stability);
}
