/**
 * Page Extractor — transforms page composition frames into PagePayload.
 */

import type { CanvasElement } from '@/types/canvas';
import type { PagePayload, PageComponentInstance } from '@/types/design-documents/page';
import { filterByDesignTag, getDesignSourceTag } from './tagging';

/** Extract a PagePayload from tagged page composition frames. */
export function extractPage(
  elements: CanvasElement[],
  pageName: string,
  layoutRef: string
): PagePayload | null {
  const pageFrames = filterByDesignTag(elements, 'page-composition');
  if (pageFrames.length === 0) return null;

  const primary = pageFrames[0];
  const children = elements.filter((el) => el.parentId === primary.id);

  const components: PageComponentInstance[] = children.map((child, idx) => {
    const tag = getDesignSourceTag(child);
    return {
      id: `inst_${idx + 1}`,
      component: tag?.parent || child.name || `component_${idx}`,
      region: inferRegion(child, primary),
      props: {},
    };
  });

  return {
    page_name: pageName,
    route: `/${pageName.toLowerCase().replace(/\s+/g, '-')}`,
    layout: layoutRef,
    components,
    responsive_variants: {
      mobile: { hidden_regions: ['sidebar-right'], collapsed_regions: ['sidebar-left'] },
      tablet: { collapsed_regions: ['sidebar-right'] },
    },
  };
}

/** Infer region placement from element position within parent frame. */
function inferRegion(child: CanvasElement, parent: CanvasElement): string {
  const relativeX = child.x - parent.x;
  const parentWidth = parent.width;
  const third = parentWidth / 3;

  if (relativeX < third) return 'sidebar-left';
  if (relativeX > third * 2) return 'sidebar-right';
  return 'content';
}
