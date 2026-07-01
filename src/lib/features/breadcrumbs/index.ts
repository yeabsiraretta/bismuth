/**
 * Breadcrumbs feature module.
 * Typed links and hierarchy navigation for vault notes.
 */

// Types
export type { BreadcrumbSegment, BreadcrumbContext } from './types';
export { PARENT_KEYS, PREV_KEYS, NEXT_KEYS } from './types';

// Services
export { buildTrail, buildContext, parseWikilinkValue, resolveSiblings } from './breadcrumbService';

// Stores
export { breadcrumbContext } from './breadcrumbStore';

// Components
export { default as BreadcrumbTrail } from './components/BreadcrumbTrail.svelte';
