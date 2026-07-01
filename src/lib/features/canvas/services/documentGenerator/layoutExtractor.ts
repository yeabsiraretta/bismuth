/**
 * Layout Extractor — transforms layout frames into LayoutPayload.
 */

import type { CanvasElement } from '@/features/canvas/types';
import type { LayoutPayload, LayoutRegion } from '@/types/design-documents/layout';
import { filterByDesignTag } from '@/features/canvas/services/documentGenerator/tagging';

/** Extract layout payload from tagged layout frames. */
export function extractLayout(elements: CanvasElement[]): LayoutPayload | null {
  const layoutFrames = filterByDesignTag(elements, 'layout');
  if (layoutFrames.length === 0) return null;

  const primary = layoutFrames[0];
  const autoLayout = primary.properties.autoLayout;

  const regions: LayoutRegion[] = (elements.filter((el) => el.parentId === primary.id)).map((child) => ({
    name: child.name || child.id,
    grid_area: child.name?.toLowerCase().replace(/\s+/g, '-') || child.id,
    min_width: (child.properties.constraints as Record<string, unknown> | undefined)?.['minWidth'] as number | undefined,
    max_width: (child.properties.constraints as Record<string, unknown> | undefined)?.['maxWidth'] as number | undefined,
    flex: autoLayout?.direction === 'horizontal' ? 1 : undefined,
  }));

  return {
    layout_name: primary.name || 'Layout',
    type: autoLayout?.direction ? 'flex' : 'grid',
    breakpoints: {
      desktop: { min_width: 1025, columns: regions.length, sidebar: 'expanded' },
      tablet: { max_width: 1024, columns: Math.max(1, regions.length - 1), sidebar: 'collapsed' },
      mobile: { max_width: 768, columns: 1, sidebar: 'hidden' },
    },
    regions,
  };
}
