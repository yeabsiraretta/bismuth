/**
 * Recipe store — reactive state for the active recipe view.
 *
 * Manages scaling, step highlighting, ingredient cross-off, and view mode.
 */

import { writable, derived, get } from 'svelte/store';
import { log } from '@/utils/logger';
import { parseRecipe, scaleQuantity, formatQuantity } from '../services/recipeParser';
import type { RecipeData, RecipeViewState, RecipeViewMode, Ingredient } from '../types';
import { DEFAULT_VIEW_STATE } from '../types';

const activeRecipeInternal = writable<RecipeData | null>(null);
const viewStateInternal = writable<RecipeViewState>({
  ...DEFAULT_VIEW_STATE,
  crossedOff: new Set(),
});

/** The currently parsed recipe data. */
export const activeRecipe = derived(activeRecipeInternal, ($r) => $r);

/** Current view state (scaling, mode, highlighting). */
export const recipeViewState = derived(viewStateInternal, ($v) => $v);

/** Whether a recipe is currently loaded. */
export const hasRecipe = derived(activeRecipeInternal, ($r) => $r !== null);

/** The scaled ingredient list. */
export const scaledIngredients = derived(
  [activeRecipeInternal, viewStateInternal],
  ([$recipe, $state]): (Ingredient & { displayQty: string })[] => {
    if (!$recipe) return [];
    return $recipe.ingredients.map((ing) => ({
      ...ing,
      displayQty: formatQuantity(scaleQuantity(ing.quantity, $state.scaleFactor)),
    }));
  }
);

/** Load a recipe from markdown content. */
export function loadRecipe(content: string, title?: string): void {
  const recipe = parseRecipe(content);
  if (title && !recipe.metadata.title) recipe.metadata.title = title;
  activeRecipeInternal.set(recipe);
  viewStateInternal.set({ ...DEFAULT_VIEW_STATE, crossedOff: new Set() });
  log.info('recipeStore: recipe loaded', { title: recipe.metadata.title });
}

/** Clear the active recipe. */
export function clearRecipe(): void {
  activeRecipeInternal.set(null);
  viewStateInternal.set({ ...DEFAULT_VIEW_STATE, crossedOff: new Set() });
}

/** Set the serving scale factor. */
export function setScale(factor: number): void {
  const clamped = Math.max(0.25, Math.min(10, factor));
  viewStateInternal.update((s) => ({ ...s, scaleFactor: clamped }));
}

/** Scale by original servings. */
export function scaleToServings(newServings: number): void {
  const recipe = get(activeRecipeInternal);
  if (!recipe?.metadata.servings) return;
  setScale(newServings / recipe.metadata.servings);
}

/** Set the view mode. */
export function setViewMode(mode: RecipeViewMode): void {
  viewStateInternal.update((s) => ({ ...s, viewMode: mode }));
}

/** Toggle an ingredient's crossed-off state. */
export function toggleIngredientCrossOff(index: number): void {
  viewStateInternal.update((s) => {
    const next = new Set(s.crossedOff);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return { ...s, crossedOff: next };
  });
}

/** Highlight a step (for step-tracking while cooking). */
export function highlightStep(index: number | null): void {
  viewStateInternal.update((s) => ({ ...s, highlightedStep: index }));
}

/** Move to the next step. */
export function nextStep(): void {
  const recipe = get(activeRecipeInternal);
  const state = get(viewStateInternal);
  if (!recipe) return;
  const next =
    state.highlightedStep === null
      ? 0
      : Math.min(state.highlightedStep + 1, recipe.steps.length - 1);
  highlightStep(next);
}

/** Move to the previous step. */
export function prevStep(): void {
  const state = get(viewStateInternal);
  if (state.highlightedStep === null || state.highlightedStep <= 0) return;
  highlightStep(state.highlightedStep - 1);
}

/** Clear all crossed-off ingredients. */
export function resetCrossOff(): void {
  viewStateInternal.update((s) => ({ ...s, crossedOff: new Set() }));
}

/** Check if a note looks like it could be a recipe. */
export function detectRecipe(content: string): boolean {
  const hasIngredients = /^#{1,3}\s*(ingredients?|what you['']?ll? need)/im.test(content);
  const hasSteps = /^#{1,3}\s*(instructions?|directions?|steps?|method)/im.test(content);
  const hasFrontmatter = /^---\n[\s\S]*?(servings?|cook|prep|recipe)[\s\S]*?\n---/i.test(content);
  return (hasIngredients && hasSteps) || hasFrontmatter;
}
