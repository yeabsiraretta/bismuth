import type { ParamMatcher } from '@sveltejs/kit';

const VALID_APP_ROUTES = new Set([
  'editor',
  'graph',
  'canvas',
  'calendar',
  'settings',
  'import',
  'projects',
  'writing',
  'flashcards',
  'creative',
  'media',
  'pokemon',
  'gamification',
  'wellness',
]);

export const match: ParamMatcher = (param) => {
  return VALID_APP_ROUTES.has(param);
};
