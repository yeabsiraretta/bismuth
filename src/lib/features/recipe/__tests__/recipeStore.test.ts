import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('@/utils/logger', () => ({
  log: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  activeRecipe,
  recipeViewState,
  hasRecipe,
  scaledIngredients,
  loadRecipe,
  clearRecipe,
  setScale,
  scaleToServings,
  setViewMode,
  toggleIngredientCrossOff,
  highlightStep,
  nextStep,
  prevStep,
  resetCrossOff,
  detectRecipe,
} from '../stores/recipeStore';

const SAMPLE_RECIPE = `---
title: Test Soup
servings: 4
---

## Ingredients
- 2 cups water
- 1 tbsp salt
- 3 carrots

## Instructions
1. Boil water.
2. Add salt and carrots.
3. Simmer for 20 minutes.`;

describe('recipeStore', () => {
  beforeEach(() => {
    clearRecipe();
    vi.clearAllMocks();
  });

  describe('loadRecipe / clearRecipe', () => {
    it('loads a recipe from markdown', () => {
      loadRecipe(SAMPLE_RECIPE);
      expect(get(hasRecipe)).toBe(true);
      expect(get(activeRecipe)?.metadata.title).toBe('Test Soup');
      expect(get(activeRecipe)?.ingredients).toHaveLength(3);
      expect(get(activeRecipe)?.steps).toHaveLength(3);
    });

    it('clears the recipe', () => {
      loadRecipe(SAMPLE_RECIPE);
      clearRecipe();
      expect(get(hasRecipe)).toBe(false);
      expect(get(activeRecipe)).toBeNull();
    });

    it('uses title fallback', () => {
      loadRecipe('## Ingredients\n- 1 egg\n## Steps\n1. Cook.', 'Fallback Title');
      expect(get(activeRecipe)?.metadata.title).toBe('Fallback Title');
    });
  });

  describe('scaling', () => {
    it('setScale updates scale factor', () => {
      loadRecipe(SAMPLE_RECIPE);
      setScale(2);
      expect(get(recipeViewState).scaleFactor).toBe(2);
    });

    it('clamps scale to valid range', () => {
      loadRecipe(SAMPLE_RECIPE);
      setScale(0.1);
      expect(get(recipeViewState).scaleFactor).toBe(0.25);
      setScale(100);
      expect(get(recipeViewState).scaleFactor).toBe(10);
    });

    it('scaleToServings adjusts factor from original', () => {
      loadRecipe(SAMPLE_RECIPE);
      scaleToServings(8);
      expect(get(recipeViewState).scaleFactor).toBe(2);
    });

    it('scaledIngredients reflects factor', () => {
      loadRecipe(SAMPLE_RECIPE);
      setScale(2);
      const ings = get(scaledIngredients);
      expect(ings[0].displayQty).toBe('4');
    });
  });

  describe('view mode', () => {
    it('defaults to card', () => {
      loadRecipe(SAMPLE_RECIPE);
      expect(get(recipeViewState).viewMode).toBe('card');
    });

    it('changes view mode', () => {
      loadRecipe(SAMPLE_RECIPE);
      setViewMode('split');
      expect(get(recipeViewState).viewMode).toBe('split');
    });
  });

  describe('ingredient cross-off', () => {
    it('toggles cross-off state', () => {
      loadRecipe(SAMPLE_RECIPE);
      toggleIngredientCrossOff(0);
      expect(get(recipeViewState).crossedOff.has(0)).toBe(true);
      toggleIngredientCrossOff(0);
      expect(get(recipeViewState).crossedOff.has(0)).toBe(false);
    });

    it('resetCrossOff clears all', () => {
      loadRecipe(SAMPLE_RECIPE);
      toggleIngredientCrossOff(0);
      toggleIngredientCrossOff(1);
      resetCrossOff();
      expect(get(recipeViewState).crossedOff.size).toBe(0);
    });
  });

  describe('step tracking', () => {
    it('highlightStep sets highlighted index', () => {
      loadRecipe(SAMPLE_RECIPE);
      highlightStep(1);
      expect(get(recipeViewState).highlightedStep).toBe(1);
    });

    it('nextStep advances', () => {
      loadRecipe(SAMPLE_RECIPE);
      highlightStep(0);
      nextStep();
      expect(get(recipeViewState).highlightedStep).toBe(1);
    });

    it('prevStep goes back', () => {
      loadRecipe(SAMPLE_RECIPE);
      highlightStep(2);
      prevStep();
      expect(get(recipeViewState).highlightedStep).toBe(1);
    });

    it('nextStep starts at 0 from null', () => {
      loadRecipe(SAMPLE_RECIPE);
      nextStep();
      expect(get(recipeViewState).highlightedStep).toBe(0);
    });

    it('nextStep clamps at last step', () => {
      loadRecipe(SAMPLE_RECIPE);
      highlightStep(2);
      nextStep();
      expect(get(recipeViewState).highlightedStep).toBe(2);
    });
  });

  describe('detectRecipe', () => {
    it('detects recipe with ingredients + instructions', () => {
      expect(detectRecipe('## Ingredients\n- flour\n## Instructions\n1. Mix')).toBe(true);
    });

    it('detects recipe from frontmatter', () => {
      expect(detectRecipe('---\nservings: 4\n---\nSome content')).toBe(true);
    });

    it('rejects non-recipe content', () => {
      expect(detectRecipe('# Meeting Notes\nDiscussed budget.')).toBe(false);
    });
  });
});
