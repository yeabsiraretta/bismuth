/**
 * Recipe Grabber service — fetches a recipe URL via Tauri IPC,
 * applies the user's template, and returns rendered markdown.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { GrabbedRecipeData, RecipeGrabberConfig } from '../types';
import { DEFAULT_GRABBER_CONFIG } from '../types';
import { applyRecipeTemplate } from './recipeTemplate';

/**
 * Fetch structured recipe data from a URL via the Rust backend.
 * The backend extracts JSON-LD Recipe schema from the page HTML.
 */
export async function fetchRecipeFromUrl(url: string): Promise<GrabbedRecipeData> {
  log.info('recipeGrabber: fetching recipe', { url });
  const data = await invoke<GrabbedRecipeData>('fetch_recipe_from_url', { url });
  log.info('recipeGrabber: recipe fetched', { name: data.name, ingredients: data.ingredients.length });
  return data;
}

/**
 * Grab a recipe from a URL and render it to markdown using the configured template.
 */
export async function grabRecipe(
  url: string,
  config: RecipeGrabberConfig = DEFAULT_GRABBER_CONFIG,
): Promise<string> {
  const data = await fetchRecipeFromUrl(url);
  return applyRecipeTemplate(config.template, data);
}

/**
 * Generate a safe filename from a recipe name.
 */
export function recipeToFilename(name: string): string {
  if (!name) return 'Untitled Recipe';
  return name
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
