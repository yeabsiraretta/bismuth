import type { ComponentDefinition } from '@/features/canvas/types';
import { BUTTON_COMPONENTS } from './ui/buttons';
import { INPUT_COMPONENTS } from './ui/inputs';
import { CARD_COMPONENTS } from './ui/cards';
import { NAVIGATION_COMPONENTS } from './ui/navigation';
import { FEEDBACK_COMPONENTS } from './ui/feedback';
import { ICON_COMPONENTS } from './ui/icons';
import { TYPOGRAPHY_COMPONENTS } from './content/typography';
import { LAYOUT_COMPONENTS } from './content/layout';
import { BISMUTH_COMPONENTS } from './content/bismuth';
import { TOKEN_COMPONENTS } from './content/tokens';

/** All built-in canvas component definitions, merged from category modules. */
export const BUILTIN_COMPONENTS: ComponentDefinition[] = [
  ...BUTTON_COMPONENTS,
  ...INPUT_COMPONENTS,
  ...CARD_COMPONENTS,
  ...NAVIGATION_COMPONENTS,
  ...TYPOGRAPHY_COMPONENTS,
  ...FEEDBACK_COMPONENTS,
  ...LAYOUT_COMPONENTS,
  ...ICON_COMPONENTS,
  ...BISMUTH_COMPONENTS,
  ...TOKEN_COMPONENTS,
];

/** Ordered list of built-in component categories. */
export const BUILTIN_CATEGORIES = [
  'Bismuth',
  'Buttons',
  'Inputs',
  'Cards',
  'Navigation',
  'Typography',
  'Feedback',
  'Layout',
  'Icons',
  'Tokens',
] as const;

export type BuiltinCategory = (typeof BUILTIN_CATEGORIES)[number];

/** Get built-in components grouped by category. */
export function getBuiltinByCategory(): Record<string, ComponentDefinition[]> {
  const groups: Record<string, ComponentDefinition[]> = {};
  for (const cat of BUILTIN_CATEGORIES) {
    groups[cat] = BUILTIN_COMPONENTS.filter((c) => c.category === cat);
  }
  return groups;
}
