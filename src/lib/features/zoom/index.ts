/**
 * Zoom feature module.
 * Zoom into headings and list items, hiding surrounding content.
 */

// Types
export type {
  ZoomTargetKind,
  ZoomTarget,
  ZoomRange,
  ZoomBreadcrumb,
  ZoomState,
  ZoomConfig,
} from './types/zoom';
export { INITIAL_ZOOM_STATE, DEFAULT_ZOOM_CONFIG } from './types/zoom';

// Services
export {
  findHeadings,
  findListItems,
  headingRange,
  listItemRange,
  calculateZoomRange,
  targetAtLine,
  buildBreadcrumbs,
} from './services/zoomService';

// Stores
export {
  zoomState,
  zoomConfig,
  isZoomed,
  zoomTarget,
  zoomRange,
  zoomBreadcrumbs,
  zoomOnClick,
  zoomIn,
  zoomOut,
  zoomReset,
  zoomToBreadcrumb,
  refreshZoomRange,
  toggleZoomOnClick,
  toggleShowBreadcrumbs,
  toggleHighlightTarget,
} from './stores/zoomStore';

// Extensions
export {
  setZoomRange,
  zoomTheme,
  zoomKeymap,
  bulletClickHandler,
  zoomExtension,
} from './extensions/zoomExtension';

// Components
export { default as ZoomBreadcrumbs } from './components/ZoomBreadcrumbs.svelte';
