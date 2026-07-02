/**
 * Speed Reader types — RSVP word-by-word reading with ORP highlighting.
 */

/** A single word token with timing and display metadata. */
export interface WordToken {
  text: string;
  /** Optimal recognition point index (0-based char position). */
  orpIndex: number;
  /** Extra delay multiplier for this word (punctuation, length, numbers). */
  delayMultiplier: number;
}

/** Speed reader playback state. */
export type ReaderState = 'idle' | 'playing' | 'paused' | 'finished';

/** Speed reader configuration. */
export interface SpeedReaderConfig {
  wpm: number;
  focusMode: boolean;
  skipWords: number;
}

export const DEFAULT_SPEED_READER_CONFIG: SpeedReaderConfig = {
  wpm: 300,
  focusMode: false,
  skipWords: 10,
};

/** Calculate the optimal recognition point for a word. */
export function calculateORP(word: string): number {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 3) return 1;
  if (len <= 5) return 2;
  if (len <= 9) return 3;
  if (len <= 13) return 4;
  return 5;
}

/** Calculate delay multiplier based on word properties. */
export function calculateDelay(word: string): number {
  let mult = 1.0;
  // Longer words get slightly more time
  if (word.length > 8) mult += 0.3;
  else if (word.length > 6) mult += 0.15;
  // Punctuation at end = pause
  if (/[.!?]$/.test(word)) mult += 0.8;
  else if (/[,;:]$/.test(word)) mult += 0.4;
  else if (/[-–—]$/.test(word)) mult += 0.2;
  // Numbers get extra time
  if (/\d/.test(word)) mult += 0.3;
  return mult;
}
