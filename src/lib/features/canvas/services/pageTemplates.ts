/**
 * Canvas Page Templates — factory for the fixed design system page structure.
 */

import type { Page } from '@/features/canvas/types/document';

/** The standard page names for a design system canvas. */
export const DESIGN_SYSTEM_PAGES = [
  'Tokens',
  'Components',
  'Layouts',
  'Flows',
  'Pages',
  'Sandbox',
] as const;

export type DesignSystemPageName = (typeof DESIGN_SYSTEM_PAGES)[number];

/** Create the fixed page structure for a new Design System canvas document. */
export function createDesignSystemPages(): Page[] {
  return DESIGN_SYSTEM_PAGES.map((name, idx) => ({
    id: `page_${name.toLowerCase()}`,
    name,
    order: idx,
    elements: [],
    background: undefined,
  }));
}

/** Get the page ID for a specific design system page type. */
export function getDesignPageId(pageName: DesignSystemPageName): string {
  return `page_${pageName.toLowerCase()}`;
}

/** Check if a page name matches a design system page. */
export function isDesignSystemPage(pageName: string): pageName is DesignSystemPageName {
  return DESIGN_SYSTEM_PAGES.includes(pageName as DesignSystemPageName);
}
