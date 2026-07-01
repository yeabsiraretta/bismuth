/**
 * Recipe feature module — interactive recipe cards from markdown notes,
 * plus URL-based recipe grabber with custom templating.
 * Public API barrel.
 */

// Types
export type {
  Ingredient,
  RecipeStep,
  RecipeMetadata,
  RecipeData,
  RecipeViewMode,
  RecipeViewState,
  GrabbedRecipeData,
  RecipeGrabberConfig,
  GrabberState,
} from './types';
export {
  DEFAULT_METADATA,
  DEFAULT_VIEW_STATE,
  COMMON_UNITS,
  FRACTION_MAP,
  DEFAULT_GRABBER_CONFIG,
  DEFAULT_GRABBER_STATE,
  DEFAULT_RECIPE_TEMPLATE,
} from './types';

// Services — parser
export {
  parseQuantity,
  parseIngredient,
  extractMetadata,
  parseRecipe,
  scaleQuantity,
  formatQuantity,
} from './services/recipeParser';

// Services — template engine
export {
  parseIsoDuration,
  formatDateWithMask,
  magicTime,
  splitTags,
  applyRecipeTemplate,
} from './services/recipeTemplate';

// Services — grabber
export { fetchRecipeFromUrl, grabRecipe, recipeToFilename } from './services/recipeGrabber';

// Stores — recipe view
export {
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
} from './stores/recipeStore';

// Stores — grabber
export {
  grabberConfig,
  grabberState,
  lastGrabbedRecipe,
  updateGrabberConfig,
  resetTemplate,
  grabRecipeFromUrl as grabRecipeAction,
  grabRecipeAsNote,
} from './stores/grabberStore';

// Components
export { default as RecipeCard } from './components/RecipeCard.svelte';
export { default as RecipePanel } from './components/RecipePanel.svelte';
