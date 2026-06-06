/**
 * Layout Document payload — page layouts, grids, responsive breakpoints.
 */

/** Responsive breakpoint configuration. */
export interface LayoutBreakpoint {
  min_width?: number;
  max_width?: number;
  columns: number;
  sidebar?: 'hidden' | 'collapsed' | 'expanded';
}

/** Named region within a layout grid. */
export interface LayoutRegion {
  name: string;
  grid_area: string;
  min_width?: number;
  max_width?: number;
  flex?: number;
}

/** Layout document payload. */
export interface LayoutPayload {
  layout_name: string;
  type: 'grid' | 'flex';
  breakpoints: Record<string, LayoutBreakpoint>;
  regions: LayoutRegion[];
  css_grid_template?: string;
}
