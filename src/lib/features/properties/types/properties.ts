/**
 * Pretty Properties types.
 *
 * Covers cover images, banners, icons, property coloring,
 * progress bars, date formatting, property hiding, and template formatting.
 */

// ─── Cover image ────────────────────────────────────────────────────────────

export type CoverShape = 'initial' | 'vertical' | 'horizontal' | 'square' | 'circle';

export interface CoverConfig {
  /** Frontmatter property name holding the cover value (default: "cover"). */
  propertyName: string;
  /** Default shape for cover images. */
  defaultShape: CoverShape;
  /** Custom widths per shape (px). */
  shapeWidths: Record<CoverShape, number>;
  /** Vault-relative folder to look for local cover images. */
  imageFolder: string;
}

// ─── Banner ─────────────────────────────────────────────────────────────────

export interface BannerConfig {
  /** Frontmatter property name for banner (default: "banner"). */
  propertyName: string;
  /** Banner height in px. */
  height: number;
  /** Vault-relative folder for local banner images. */
  imageFolder: string;
}

// ─── Icon ───────────────────────────────────────────────────────────────────

export type IconSource = 'image' | 'lucide' | 'emoji';

export interface IconConfig {
  /** Frontmatter property name for icon (default: "icon"). */
  propertyName: string;
  /** Vault-relative folder for local icon images. */
  imageFolder: string;
}

export interface ResolvedIcon {
  source: IconSource;
  value: string;
}

// ─── Property colors ────────────────────────────────────────────────────────

export interface PropertyColor {
  /** The property value this color is assigned to. */
  value: string;
  /** CSS color string. */
  color: string;
}

export interface PropertyColorMap {
  /** Property key → per-value color assignments. */
  [propertyKey: string]: PropertyColor[];
}

// ─── Tag colors ─────────────────────────────────────────────────────────────

export interface TagColor {
  tag: string;
  color: string;
}

// ─── Progress bars ──────────────────────────────────────────────────────────

export interface ProgressConfig {
  /** Property key for the value. */
  property: string;
  /** Maximum value (default 100). */
  max: number;
  /** Optional: property key from which to read the max value. */
  maxProperty?: string;
}

// ─── Date formatting ────────────────────────────────────────────────────────

export interface DateFormatConfig {
  /** Format string for date properties (moment.js syntax). */
  dateFormat: string;
  /** Format string for datetime properties. */
  datetimeFormat: string;
}

export type RelativeDate = 'past' | 'present' | 'future';

export interface DateColorConfig {
  past: string;
  present: string;
  future: string;
}

// ─── Property templates ─────────────────────────────────────────────────────

export interface PropertyTemplate {
  /** Property key this template applies to. */
  property: string;
  /** Handlebars-style template string. */
  template: string;
}

// ─── Hidden properties ──────────────────────────────────────────────────────

/** Set of property keys hidden from display. */
export type HiddenProperties = Set<string>;

// ─── Main config ────────────────────────────────────────────────────────────

export interface PrettyPropertiesConfig {
  enabled: boolean;
  cover: CoverConfig;
  banner: BannerConfig;
  icon: IconConfig;
  dateFormat: DateFormatConfig;
  dateColors: DateColorConfig;
  /** Property keys globally hidden. */
  hiddenProperties: string[];
  /** Per-property value colors. */
  propertyColors: PropertyColorMap;
  /** Tag colors. */
  tagColors: TagColor[];
  /** Show colored tags in note body (not just properties). */
  coloredTagsInBody: boolean;
  /** Show color button on text properties. */
  showTextColorButton: boolean;
  /** Progress bar configs per property. */
  progressBars: ProgressConfig[];
  /** Custom property templates. */
  templates: PropertyTemplate[];
}

export const DEFAULT_PRETTY_PROPERTIES_CONFIG: PrettyPropertiesConfig = {
  enabled: true,
  cover: {
    propertyName: 'cover',
    defaultShape: 'initial',
    shapeWidths: { initial: 120, vertical: 100, horizontal: 180, square: 120, circle: 100 },
    imageFolder: '',
  },
  banner: {
    propertyName: 'banner',
    height: 200,
    imageFolder: '',
  },
  icon: {
    propertyName: 'icon',
    imageFolder: '',
  },
  dateFormat: {
    dateFormat: 'YYYY-MM-DD',
    datetimeFormat: 'YYYY-MM-DD HH:mm',
  },
  dateColors: {
    past: '',
    present: '',
    future: '',
  },
  hiddenProperties: [],
  propertyColors: {},
  tagColors: [],
  coloredTagsInBody: false,
  showTextColorButton: true,
  progressBars: [],
  templates: [],
};
