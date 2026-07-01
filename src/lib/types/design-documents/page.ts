/**
 * Page Document payload — full page compositions using components and layouts.
 */

/** A component instance placed within a page region. */
export interface PageComponentInstance {
  id: string;
  component: string;
  region: string;
  props: Record<string, unknown>;
}

/** Responsive variant for a page (hidden/collapsed regions per breakpoint). */
export interface ResponsivePageVariant {
  hidden_regions?: string[];
  collapsed_regions?: string[];
}

/** Page document payload. */
export interface PagePayload {
  page_name: string;
  route: string;
  layout: string;
  components: PageComponentInstance[];
  responsive_variants: Record<string, ResponsivePageVariant>;
}
