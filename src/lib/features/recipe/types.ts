/**
 * Recipe types — parsed recipe structure, ingredients, and view state.
 *
 * Recipes are stored as regular markdown notes with optional frontmatter.
 * The parser extracts structure from headings, lists, and quantities.
 */

export interface Ingredient {
  raw: string;
  quantity: number | null;
  unit: string;
  name: string;
  note: string;
  stepIndex: number | null;
}

export interface RecipeStep {
  index: number;
  text: string;
  ingredients: Ingredient[];
}

export interface RecipeMetadata {
  title: string;
  servings: number | null;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  source: string;
  tags: string[];
  image: string;
}

export interface RecipeData {
  metadata: RecipeMetadata;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  notes: string[];
}

export type RecipeViewMode = 'card' | 'split' | 'steps';

export interface RecipeViewState {
  scaleFactor: number;
  viewMode: RecipeViewMode;
  activeStepIndex: number;
  crossedOff: Set<number>;
  highlightedStep: number | null;
}

export const DEFAULT_METADATA: RecipeMetadata = {
  title: '',
  servings: null,
  prepTime: '',
  cookTime: '',
  totalTime: '',
  source: '',
  tags: [],
  image: '',
};

export const DEFAULT_VIEW_STATE: RecipeViewState = {
  scaleFactor: 1,
  viewMode: 'card',
  activeStepIndex: 0,
  crossedOff: new Set(),
  highlightedStep: null,
};

export const COMMON_UNITS: readonly string[] = [
  'tsp', 'teaspoon', 'teaspoons',
  'tbsp', 'tablespoon', 'tablespoons',
  'cup', 'cups', 'c',
  'oz', 'ounce', 'ounces',
  'lb', 'lbs', 'pound', 'pounds',
  'g', 'gram', 'grams',
  'kg', 'kilogram', 'kilograms',
  'ml', 'milliliter', 'milliliters',
  'l', 'liter', 'liters',
  'pinch', 'dash', 'handful',
  'piece', 'pieces', 'slice', 'slices',
  'clove', 'cloves', 'sprig', 'sprigs',
  'can', 'cans', 'bunch', 'bunches',
  'stick', 'sticks', 'package', 'packages',
];

export const FRACTION_MAP: Record<string, number> = {
  '\u00BC': 0.25, '\u00BD': 0.5, '\u00BE': 0.75,
  '\u2153': 1/3, '\u2154': 2/3,
  '\u2155': 0.2, '\u2156': 0.4, '\u2157': 0.6, '\u2158': 0.8,
  '\u2159': 1/6, '\u215A': 5/6,
  '\u215B': 0.125, '\u215C': 0.375, '\u215D': 0.625, '\u215E': 0.875,
};

/** Raw recipe data returned from the Rust backend (JSON-LD extraction). */
export interface GrabbedRecipeData {
  url: string;
  name: string;
  description: string;
  image: string;
  author: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  recipeYield: string;
  recipeCategory: string;
  recipeCuisine: string;
  keywords: string;
  datePublished: string;
  ingredients: string[];
  instructions: string[];
  nutrition: Record<string, string>;
  rawJson: string;
}

/** Recipe grabber settings persisted in localStorage. */
export interface RecipeGrabberConfig {
  saveImage: boolean;
  imageSavePath: string;
  template: string;
}

/** State while a grab operation is in progress. */
export interface GrabberState {
  isGrabbing: boolean;
  lastError: string;
  lastGrabbedUrl: string;
}

export const DEFAULT_RECIPE_TEMPLATE = `---
title: "{{name}}"
source: "{{url}}"
author: "{{author}}"
image: "{{image}}"
prep: "{{magicTime prepTime}}"
cook: "{{magicTime cookTime}}"
total: "{{magicTime totalTime}}"
servings: "{{recipeYield}}"
category: "{{recipeCategory}}"
cuisine: "{{recipeCuisine}}"
tags:
{{splitTags keywords}}
---

# {{name}}

{{description}}

![]({{image}})

## Ingredients

{{#each ingredients}}
- {{this}}
{{/each}}

## Instructions

{{#each instructions}}
{{@number}}. {{this}}
{{/each}}

---
*Grabbed from [{{name}}]({{url}})*
`;

export const DEFAULT_GRABBER_CONFIG: RecipeGrabberConfig = {
  saveImage: false,
  imageSavePath: 'attachments/recipes',
  template: DEFAULT_RECIPE_TEMPLATE,
};

export const DEFAULT_GRABBER_STATE: GrabberState = {
  isGrabbing: false,
  lastError: '',
  lastGrabbedUrl: '',
};
