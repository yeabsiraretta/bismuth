import { describe, it, expect } from 'vitest';
import {
  parseQuantity, parseIngredient, extractMetadata, parseRecipe,
  scaleQuantity, formatQuantity,
} from '../services/recipeParser';

describe('parseQuantity', () => {
  it('parses integers', () => expect(parseQuantity('3')).toBe(3));
  it('parses decimals', () => expect(parseQuantity('1.5')).toBe(1.5));
  it('parses simple fractions', () => expect(parseQuantity('1/2')).toBe(0.5));
  it('parses mixed numbers', () => expect(parseQuantity('2 1/4')).toBe(2.25));
  it('parses unicode half', () => expect(parseQuantity('\u00BD')).toBe(0.5));
  it('parses unicode quarter', () => expect(parseQuantity('\u00BC')).toBe(0.25));
  it('parses mixed unicode', () => expect(parseQuantity('1\u00BD')).toBe(1.5));
  it('parses range (takes first)', () => expect(parseQuantity('2-3')).toBe(2));
  it('returns null for empty', () => expect(parseQuantity('')).toBeNull());
  it('returns null for text', () => expect(parseQuantity('some')).toBeNull());
});

describe('parseIngredient', () => {
  it('parses qty + unit + name', () => {
    const ing = parseIngredient('2 cups flour');
    expect(ing.quantity).toBe(2);
    expect(ing.unit).toBe('cups');
    expect(ing.name).toBe('flour');
  });

  it('parses qty + name (no unit)', () => {
    const ing = parseIngredient('3 eggs');
    expect(ing.quantity).toBe(3);
    expect(ing.unit).toBe('');
    expect(ing.name).toBe('eggs');
  });

  it('parses name only', () => {
    const ing = parseIngredient('salt to taste');
    expect(ing.quantity).toBeNull();
    expect(ing.name).toBe('salt to taste');
  });

  it('extracts parenthetical notes', () => {
    const ing = parseIngredient('1 cup butter (softened)');
    expect(ing.quantity).toBe(1);
    expect(ing.unit).toBe('cup');
    expect(ing.note).toBe('softened');
  });

  it('handles fractions', () => {
    const ing = parseIngredient('1/2 tsp vanilla extract');
    expect(ing.quantity).toBe(0.5);
    expect(ing.unit).toBe('tsp');
    expect(ing.name).toBe('vanilla extract');
  });
});

describe('extractMetadata', () => {
  it('extracts from frontmatter', () => {
    const content = `---
title: Chocolate Cake
servings: 8
prep-time: 20 min
cook-time: 35 min
tags: [dessert, chocolate]
---
# Chocolate Cake`;
    const meta = extractMetadata(content);
    expect(meta.title).toBe('Chocolate Cake');
    expect(meta.servings).toBe(8);
    expect(meta.prepTime).toBe('20 min');
    expect(meta.cookTime).toBe('35 min');
    expect(meta.tags).toContain('dessert');
  });

  it('falls back to heading for title', () => {
    const meta = extractMetadata('# My Recipe\nSome text');
    expect(meta.title).toBe('My Recipe');
  });

  it('handles missing frontmatter gracefully', () => {
    const meta = extractMetadata('Just some text');
    expect(meta.title).toBe('');
    expect(meta.servings).toBeNull();
  });
});

describe('parseRecipe', () => {
  const fullRecipe = `---
title: Test Cookies
servings: 24
---
A simple cookie recipe.

## Ingredients
- 2 cups flour
- 1 cup sugar
- 2 eggs
- 1 tsp vanilla

## Instructions
1. Preheat oven to 350F.
2. Mix flour and sugar together.
3. Add eggs and vanilla, stir until combined.
4. Bake for 12 minutes.

## Notes
- Can substitute brown sugar.
- Store in airtight container.`;

  it('parses metadata', () => {
    const recipe = parseRecipe(fullRecipe);
    expect(recipe.metadata.title).toBe('Test Cookies');
    expect(recipe.metadata.servings).toBe(24);
  });

  it('parses description', () => {
    const recipe = parseRecipe(fullRecipe);
    expect(recipe.description).toBe('A simple cookie recipe.');
  });

  it('parses all ingredients', () => {
    const recipe = parseRecipe(fullRecipe);
    expect(recipe.ingredients).toHaveLength(4);
    expect(recipe.ingredients[0].name).toBe('flour');
    expect(recipe.ingredients[0].quantity).toBe(2);
    expect(recipe.ingredients[2].name).toBe('eggs');
  });

  it('parses all steps', () => {
    const recipe = parseRecipe(fullRecipe);
    expect(recipe.steps).toHaveLength(4);
    expect(recipe.steps[0].text).toContain('Preheat');
    expect(recipe.steps[3].text).toContain('Bake');
  });

  it('parses notes', () => {
    const recipe = parseRecipe(fullRecipe);
    expect(recipe.notes).toHaveLength(2);
    expect(recipe.notes[0]).toContain('brown sugar');
  });

  it('handles bullet-point steps', () => {
    const content = `## Ingredients
- 1 cup water
## Steps
- Boil water.
- Add tea bag.`;
    const recipe = parseRecipe(content);
    expect(recipe.steps).toHaveLength(2);
  });

  it('handles empty content', () => {
    const recipe = parseRecipe('');
    expect(recipe.ingredients).toHaveLength(0);
    expect(recipe.steps).toHaveLength(0);
  });
});

describe('scaleQuantity', () => {
  it('scales by factor', () => expect(scaleQuantity(2, 1.5)).toBe(3));
  it('handles null', () => expect(scaleQuantity(null, 2)).toBeNull());
  it('handles half', () => expect(scaleQuantity(1, 0.5)).toBe(0.5));
});

describe('formatQuantity', () => {
  it('formats integers', () => expect(formatQuantity(2)).toBe('2'));
  it('formats half as unicode', () => expect(formatQuantity(0.5)).toBe('\u00BD'));
  it('formats quarter as unicode', () => expect(formatQuantity(0.25)).toBe('\u00BC'));
  it('formats mixed fraction', () => expect(formatQuantity(1.5)).toBe('1 \u00BD'));
  it('formats null as empty', () => expect(formatQuantity(null)).toBe(''));
  it('formats decimal', () => expect(formatQuantity(1.3)).toBe('1.3'));
});
