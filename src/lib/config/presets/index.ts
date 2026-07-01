/**
 * Centralized Preset Data & Constants
 * Barrel re-export from sub-modules.
 */

export { COLOR_PRESETS, ICON_PRESETS, KEYBOARD_SHORTCUTS, VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES } from './canvas-presets';
export { TEMPLATES, DEFAULT_SETTINGS } from './template-presets';

import { COLOR_PRESETS, ICON_PRESETS, KEYBOARD_SHORTCUTS, VALIDATION_RULES, ERROR_MESSAGES, SUCCESS_MESSAGES } from './canvas-presets';
import { TEMPLATES, DEFAULT_SETTINGS } from './template-presets';

export default {
  COLOR_PRESETS,
  ICON_PRESETS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_SETTINGS,
  TEMPLATES,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
