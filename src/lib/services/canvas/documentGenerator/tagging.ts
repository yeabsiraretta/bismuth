/**
 * Design-source tagging utility — reads special tags from canvas elements
 * that mark which elements participate in document generation.
 *
 * Tags are stored in element names using a `[design:type:parent]` convention.
 * Example: "[design:variant:Button] Primary" → type='variant', parent='Button'
 */

import type { CanvasElement } from '@/types/canvas';

/** Parsed design source tag from an element. */
export interface DesignSourceTag {
  type: 'component' | 'variant' | 'layout' | 'flow-step' | 'token-swatch' | 'page-composition';
  parent?: string;
}

const TAG_REGEX = /^\[design:([a-z-]+)(?::([^\]]+))?\]/;

/** Extract design source tag from a canvas element's name. Returns null if untagged. */
export function getDesignSourceTag(element: CanvasElement): DesignSourceTag | null {
  const name = element.name;
  if (!name) return null;

  const match = name.match(TAG_REGEX);
  if (!match) return null;

  return {
    type: match[1] as DesignSourceTag['type'],
    parent: match[2] || undefined,
  };
}

/** Check if an element is tagged as a design source. */
export function isDesignSource(element: CanvasElement): boolean {
  return getDesignSourceTag(element) !== null;
}

/** Filter elements to only design-tagged ones of a specific type. */
export function filterByDesignTag(
  elements: CanvasElement[],
  tagType: DesignSourceTag['type']
): CanvasElement[] {
  return elements.filter((el) => {
    const tag = getDesignSourceTag(el);
    return tag?.type === tagType;
  });
}
