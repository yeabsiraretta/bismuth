import type { ParamMatcher } from '@sveltejs/kit';

const VALID_SETTINGS_TABS = new Set([
  'general',
  'editor',
  'appearance',
  'vault',
  'hotkeys',
  'about',
  'ai',
  'media',
  'integration',
  'calendar',
  'typewriter',
  'vim',
  'changelog',
  'versioning',
  'updates',
  'performance',
  'window',
]);

export const match: ParamMatcher = (param) => {
  return VALID_SETTINGS_TABS.has(param);
};
