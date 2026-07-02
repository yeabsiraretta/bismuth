/**
 * Slides sub-component barrel (Spec 043).
 *
 * Re-exports all slide-specific Svelte components from this subdirectory.
 * Used by parent canvas components to import slides sub-components.
 *
 * Directory density: 5 files (index.ts + 4 components) — under 8 limit.
 */

export { default as SlideThumbnailStrip } from './SlideThumbnailStrip.svelte';
export { default as SpeakerNotesPanel } from './SpeakerNotesPanel.svelte';
export { default as SlidePresentation } from './SlidePresentation.svelte';
export { default as PresenterSidebar } from './PresenterSidebar.svelte';
