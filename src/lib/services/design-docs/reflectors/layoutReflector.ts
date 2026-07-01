/**
 * Layout Reflector — parses grid-system.css to produce a LayoutPayload.
 */

import type { LayoutPayload, LayoutRegion } from '@/types/design-documents/layout';

/** Parse grid-system.css content and extract a LayoutPayload. */
export function reflectLayoutFromCSS(cssContent: string): LayoutPayload | null {
  const gridTemplate = extractGridTemplate(cssContent);
  const regions = extractRegions(cssContent);

  if (regions.length === 0) return null;

  return {
    layout_name: 'AppLayout',
    type: 'grid',
    breakpoints: extractBreakpoints(cssContent),
    regions,
    css_grid_template: gridTemplate,
  };
}

/** Extract grid-template from CSS. */
function extractGridTemplate(content: string): string | undefined {
  const match = content.match(/grid-template(?:-columns|-areas)?\s*:\s*(.+?)\s*;/);
  return match?.[1];
}

/** Extract named regions from grid-template-areas or grid-area declarations. */
function extractRegions(content: string): LayoutRegion[] {
  const regions: LayoutRegion[] = [];
  const areaRegex = /--panel-([\w-]+)-(?:min|max|width)\s*:\s*(\d+)/g;
  const seen = new Set<string>();
  let match;

  while ((match = areaRegex.exec(content)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      regions.push({
        name,
        grid_area: name,
        min_width: extractNumericVar(content, `--panel-${name}-min`),
        max_width: extractNumericVar(content, `--panel-${name}-max`),
      });
    }
  }
  return regions;
}

/** Extract a numeric CSS variable value. */
function extractNumericVar(content: string, varName: string): number | undefined {
  const regex = new RegExp(`${varName}\\s*:\\s*(\\d+)`);
  const match = content.match(regex);
  return match ? parseInt(match[1], 10) : undefined;
}

/** Extract breakpoint definitions from media queries. */
function extractBreakpoints(content: string): LayoutPayload['breakpoints'] {
  const breakpoints: LayoutPayload['breakpoints'] = {};
  const mediaRegex = /@media\s*\((?:max|min)-width:\s*(\d+)px\)/g;
  let match;
  const widths: number[] = [];

  while ((match = mediaRegex.exec(content)) !== null) {
    widths.push(parseInt(match[1], 10));
  }

  widths.sort((a, b) => a - b);
  if (widths.length >= 1) {
    breakpoints['mobile'] = { max_width: widths[0], columns: 1, sidebar: 'hidden' };
  }
  if (widths.length >= 2) {
    breakpoints['tablet'] = { max_width: widths[1], columns: 2, sidebar: 'collapsed' };
  }
  breakpoints['desktop'] = { min_width: (widths[widths.length - 1] || 1024) + 1, columns: 3, sidebar: 'expanded' };

  return breakpoints;
}
