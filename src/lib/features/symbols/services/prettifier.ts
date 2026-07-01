/**
 * Symbol prettifier service — core replacement logic.
 *
 * Given text ending at cursor, finds the longest matching trigger
 * and returns the replacement info. Rules are checked longest-first
 * to avoid prefix conflicts (e.g. "<->" before "<-").
 *
 * Two categories of triggers:
 * - **Symbol triggers** (contain non-alphanumeric chars): replace immediately
 * - **Word triggers** (alphanumeric like "pi", "alpha"): require word boundary
 *   before and after to avoid replacing inside normal words
 */

import type { SymbolRule } from '../types';
import { WORD_BOUNDARY } from '../types';

export interface ReplacementMatch {
  triggerStart: number;
  triggerEnd: number;
  replacement: string;
}

/** Check whether a trigger is a "word" trigger (purely alphabetic). */
export function isWordTrigger(trigger: string): boolean {
  return /^[a-zA-Z]+$/.test(trigger);
}

/**
 * Sort rules by trigger length descending so longest matches are tried first.
 */
export function sortRules(rules: SymbolRule[]): SymbolRule[] {
  return [...rules].sort((a, b) => b.trigger.length - a.trigger.length);
}

/**
 * Find a matching trigger at the end of `textBefore` + the just-typed `inserted` char.
 * Returns replacement info, or null if no match.
 *
 * @param textBefore  Text before cursor (before the newly inserted char)
 * @param inserted    The character(s) just typed
 * @param rules       Enabled rules, sorted longest-first
 * @param charAfter   The character after cursor (for word boundary check)
 */
export function findMatch(
  textBefore: string,
  inserted: string,
  rules: SymbolRule[],
  charAfter: string = '',
): ReplacementMatch | null {
  const combined = textBefore + inserted;

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const { trigger, replacement } = rule;

    if (combined.length < trigger.length) continue;
    const candidateStart = combined.length - trigger.length;
    const candidate = combined.slice(candidateStart);

    if (candidate !== trigger) continue;

    if (isWordTrigger(trigger)) {
      const charBefore = candidateStart > 0 ? combined[candidateStart - 1] : '';
      if (charBefore && !WORD_BOUNDARY.test(charBefore)) continue;
      if (charAfter && !WORD_BOUNDARY.test(charAfter)) continue;
    }

    return {
      triggerStart: candidateStart,
      triggerEnd: combined.length,
      replacement,
    };
  }

  return null;
}

/**
 * Apply all symbol replacements to an entire string (batch mode).
 * Useful for "prettify entire document" command.
 */
export function prettifyText(text: string, rules: SymbolRule[]): string {
  const sorted = sortRules(rules.filter(r => r.enabled));
  let result = text;

  for (const rule of sorted) {
    if (isWordTrigger(rule.trigger)) {
      const regex = new RegExp(
        `(?<=^|[\\s.,;:!?()\\[\\]{}'"])${escapeRegExp(rule.trigger)}(?=$|[\\s.,;:!?()\\[\\]{}'"])`,
        'g',
      );
      result = result.replace(regex, rule.replacement);
    } else {
      result = result.split(rule.trigger).join(rule.replacement);
    }
  }

  return result;
}

/**
 * Reverse: convert unicode symbols back to ASCII triggers (for editing).
 * Uses shortest trigger per replacement to prefer minimal ASCII form.
 */
export function unprettifyText(text: string, rules: SymbolRule[]): string {
  const shortest = new Map<string, string>();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const existing = shortest.get(rule.replacement);
    if (!existing || rule.trigger.length < existing.length) {
      shortest.set(rule.replacement, rule.trigger);
    }
  }
  let result = text;
  for (const [replacement, trigger] of shortest) {
    result = result.split(replacement).join(trigger);
  }
  return result;
}

/** Escape special regex characters. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
