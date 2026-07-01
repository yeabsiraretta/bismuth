/**
 * Recipe parser — extracts structured recipe data from markdown notes.
 *
 * Supports flexible markdown format:
 * - Frontmatter for metadata (servings, times, source)
 * - Ingredient lists under ## Ingredients heading
 * - Numbered or bulleted steps under ## Instructions/Directions/Steps/Method
 * - Notes under ## Notes/Tips
 * - Quantities with fractions, decimals, ranges, and mixed numbers
 */

import type { RecipeData, RecipeMetadata, Ingredient, RecipeStep } from '../types';
import { DEFAULT_METADATA, COMMON_UNITS, FRACTION_MAP } from '../types';

const INGREDIENT_HEADINGS = /^#{1,3}\s*(ingredients?|what you['']?ll? need)/i;
const STEP_HEADINGS =
  /^#{1,3}\s*(instructions?|directions?|steps?|method|preparation|how to make)/i;
const NOTES_HEADINGS = /^#{1,3}\s*(notes?|tips?|variations?|substitutions?)/i;
const SUB_HEADING = /^#{2,4}\s+(.+)/;
const LIST_ITEM = /^\s*[-*+]\s+(.+)/;
const ORDERED_ITEM = /^\s*\d+[.)]\s+(.+)/;

/**
 * Parse a quantity string into a number. Handles fractions, mixed numbers,
 * unicode fractions, ranges (takes first value).
 */
export function parseQuantity(str: string): number | null {
  const trimmed = str.trim();
  if (!trimmed) return null;

  for (const [char, val] of Object.entries(FRACTION_MAP)) {
    if (trimmed === char) return val;
    const mixedMatch = trimmed.match(
      new RegExp(`^(\\d+)\\s*${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
    );
    if (mixedMatch) return parseInt(mixedMatch[1], 10) + val;
  }

  const rangeMatch = trimmed.match(/^([\d.]+)\s*[-–—to]+\s*([\d.]+)$/);
  if (rangeMatch) return parseFloat(rangeMatch[1]);

  const fractionMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    return (
      parseInt(fractionMatch[1], 10) +
      parseInt(fractionMatch[2], 10) / parseInt(fractionMatch[3], 10)
    );
  }

  const simpleFraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (simpleFraction) return parseInt(simpleFraction[1], 10) / parseInt(simpleFraction[2], 10);

  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

/**
 * Parse a single ingredient line into structured data.
 */
export function parseIngredient(line: string, stepIndex: number | null = null): Ingredient {
  const raw = line.trim();
  const noteMatch = raw.match(/[,(]\s*(.+?)\s*[,)]?\s*$/);
  const note = noteMatch ? noteMatch[1] : '';
  const mainPart = noteMatch ? raw.slice(0, noteMatch.index).trim() : raw;

  const qtyPattern = /^([\d\s/.\u00BC-\u00BE\u2150-\u215E]+(?:\s*[-–—to]+\s*[\d\s/.]+)?)\s*/;
  const qtyMatch = mainPart.match(qtyPattern);

  let quantity: number | null = null;
  let rest = mainPart;
  if (qtyMatch) {
    quantity = parseQuantity(qtyMatch[1]);
    rest = mainPart.slice(qtyMatch[0].length).trim();
  }

  let unit = '';
  const unitPattern = new RegExp(`^(${COMMON_UNITS.join('|')})\\.?\\s+`, 'i');
  const unitMatch = rest.match(unitPattern);
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    rest = rest.slice(unitMatch[0].length).trim();
  }

  return { raw, quantity, unit, name: rest, note, stepIndex };
}

/**
 * Extract frontmatter metadata from note content.
 */
export function extractMetadata(content: string): RecipeMetadata {
  const meta = { ...DEFAULT_METADATA };
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) meta.title = titleMatch[1].trim();
    return meta;
  }

  const fm = fmMatch[1];
  const get = (key: string) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+)`, 'mi'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  };

  meta.title = get('title') || content.match(/^#\s+(.+)/m)?.[1]?.trim() || '';
  meta.servings = parseQuantity(get('servings')) ?? parseQuantity(get('yields'));
  meta.prepTime = get('prep[_-]?time') || get('prep');
  meta.cookTime = get('cook[_-]?time') || get('cook');
  meta.totalTime = get('total[_-]?time') || get('time');
  meta.source = get('source') || get('url') || get('from');
  meta.image = get('image') || get('cover');

  const tagsMatch = fm.match(/^tags?:\s*\[?(.+?)\]?\s*$/im);
  if (tagsMatch) {
    meta.tags = tagsMatch[1]
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  }

  return meta;
}

/**
 * Parse full markdown content into structured RecipeData.
 */
export function parseRecipe(content: string): RecipeData {
  const metadata = extractMetadata(content);
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  const lines = body.split('\n');

  let section: 'preamble' | 'ingredients' | 'steps' | 'notes' = 'preamble';
  const description: string[] = [];
  const ingredients: Ingredient[] = [];
  const steps: RecipeStep[] = [];
  const notes: string[] = [];
  let currentStepText = '';
  let stepIngredients: Ingredient[] = [];

  const flushStep = () => {
    if (currentStepText.trim()) {
      steps.push({
        index: steps.length,
        text: currentStepText.trim(),
        ingredients: [...stepIngredients],
      });
      stepIngredients = [];
      currentStepText = '';
    }
  };

  for (const line of lines) {
    if (INGREDIENT_HEADINGS.test(line)) {
      section = 'ingredients';
      continue;
    }
    if (STEP_HEADINGS.test(line)) {
      flushStep();
      section = 'steps';
      continue;
    }
    if (NOTES_HEADINGS.test(line)) {
      flushStep();
      section = 'notes';
      continue;
    }

    if (SUB_HEADING.test(line) && section !== 'preamble') {
      if (section === 'steps') flushStep();
      continue;
    }

    if (section === 'preamble') {
      if (line.startsWith('#') && !metadata.title) {
        metadata.title = line.replace(/^#+\s+/, '').trim();
      } else if (line.trim()) {
        description.push(line);
      }
      continue;
    }

    if (section === 'ingredients') {
      const listMatch = line.match(LIST_ITEM) || line.match(ORDERED_ITEM);
      if (listMatch) {
        ingredients.push(parseIngredient(listMatch[1]));
      }
      continue;
    }

    if (section === 'steps') {
      const orderedMatch = line.match(ORDERED_ITEM);
      const listMatch = line.match(LIST_ITEM);
      if (orderedMatch || listMatch) {
        flushStep();
        currentStepText = (orderedMatch || listMatch)![1];
      } else if (line.trim()) {
        currentStepText += (currentStepText ? ' ' : '') + line.trim();
      }
      continue;
    }

    if (section === 'notes') {
      const listMatch = line.match(LIST_ITEM);
      if (listMatch) notes.push(listMatch[1]);
      else if (line.trim()) notes.push(line.trim());
    }
  }

  flushStep();
  return { metadata, description: description.join('\n').trim(), ingredients, steps, notes };
}

/**
 * Scale an ingredient quantity by a factor.
 */
export function scaleQuantity(qty: number | null, factor: number): number | null {
  if (qty === null) return null;
  return Math.round(qty * factor * 100) / 100;
}

/**
 * Format a scaled quantity for display.
 */
export function formatQuantity(qty: number | null): string {
  if (qty === null) return '';
  if (Number.isInteger(qty)) return String(qty);
  const thirds = [1 / 3, 2 / 3];
  for (const t of thirds) {
    if (Math.abs(qty - Math.round(qty - (qty % 1)) - t) < 0.02) {
      const whole = Math.floor(qty);
      const frac = t === 1 / 3 ? '\u2153' : '\u2154';
      return whole > 0 ? `${whole} ${frac}` : frac;
    }
  }
  const fractions: [number, string][] = [
    [0.25, '\u00BC'],
    [0.5, '\u00BD'],
    [0.75, '\u00BE'],
    [0.125, '\u215B'],
    [0.375, '\u215C'],
    [0.625, '\u215D'],
    [0.875, '\u215E'],
  ];
  const whole = Math.floor(qty);
  const remainder = qty - whole;
  for (const [val, char] of fractions) {
    if (Math.abs(remainder - val) < 0.02) {
      return whole > 0 ? `${whole} ${char}` : char;
    }
  }
  return qty.toFixed(qty < 10 ? 1 : 0).replace(/\.0$/, '');
}
