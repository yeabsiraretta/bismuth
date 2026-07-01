/**
 * Life Tracker types — property definitions, data points, visualization configs.
 * All tracked data lives as YAML frontmatter in daily/periodic notes.
 */

// ─── Property types ──────────────────────────────────────────────────────────

export type PropertyType = 'number' | 'text' | 'checkbox' | 'date' | 'list' | 'tags';

export type VisualizationType =
  | 'heatmap'
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polar'
  | 'scatter'
  | 'bubble'
  | 'tag-cloud'
  | 'timeline';

export type ColorScheme = 'green' | 'blue' | 'purple' | 'orange' | 'red';
export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type AggregationMethod = 'average' | 'sum' | 'count' | 'min' | 'max' | 'latest';
export type FirstDayOfWeek = 'monday' | 'sunday';

export type TimeFrame =
  | 'all'
  | 'last-7'
  | 'last-30'
  | 'last-90'
  | 'last-365'
  | 'this-week'
  | 'this-month'
  | 'this-quarter'
  | 'this-year';

// ─── Property definition ─────────────────────────────────────────────────────

export interface ValueMapping {
  display: string;
  numeric: number;
}

export interface PropertyConstraints {
  min?: number;
  max?: number;
  allowedValues?: string[];
}

export interface NoteFilter {
  folder?: string;
  tag?: string;
  pattern?: string;
}

export interface PropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  defaultValue?: unknown;
  constraints?: PropertyConstraints;
  valueMappings?: ValueMapping[];
  noteFilter?: NoteFilter;
  order: number;
}

// ─── Data points ─────────────────────────────────────────────────────────────

export interface DataPoint {
  date: string;
  value: number | string | boolean | string[];
  numericValue: number | null;
  sourcePath: string;
}

export interface AggregatedPoint {
  date: string;
  value: number;
  count: number;
  label?: string;
}

export interface HeatmapCell {
  date: string;
  value: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek: number;
  weekIndex: number;
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'flat';
  percentChange: number;
  arrow: string;
}

// ─── Visualization config ────────────────────────────────────────────────────

export interface ScaleConfig {
  auto: boolean;
  min: number;
  max: number;
}

export interface ReferenceLine {
  label: string;
  value: number;
  color: string;
}

export interface CardConfig {
  id: string;
  propertyName: string;
  visualization: VisualizationType;
  colorScheme: ColorScheme;
  scale: ScaleConfig;
  referenceLines: ReferenceLine[];
  aggregation: AggregationMethod;
  movingAverage: number | null;
  showLegend: boolean;
  showGrid: boolean;
  order: number;
  hidden: boolean;
}

export interface OverlayConfig {
  id: string;
  name: string;
  propertyNames: string[];
  visualization: 'line' | 'bar' | 'area';
  colorScheme: ColorScheme;
  hideIndividual: boolean;
  order: number;
}

// ─── Visualization preset ────────────────────────────────────────────────────

export interface VisualizationPreset {
  id: string;
  namePattern: string;
  visualization: VisualizationType;
  scale?: ScaleConfig;
  colorScheme?: ColorScheme;
}

// ─── Tracker settings ────────────────────────────────────────────────────────

export interface TrackerSettings {
  dateProperty: string;
  timeFrame: TimeFrame;
  granularity: TimeGranularity;
  columns: number;
  firstDayOfWeek: FirstDayOfWeek;
  animationDuration: number;
  showConfetti: boolean;
  defaultVisualization: VisualizationType;
  showEmptyDates: boolean;
}

// ─── Capture state ───────────────────────────────────────────────────────────

export interface CaptureState {
  active: boolean;
  currentIndex: number;
  notePath: string | null;
  batchPaths: string[];
  batchIndex: number;
  values: Record<string, unknown>;
  filterMissing: boolean;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TRACKER_SETTINGS: TrackerSettings = {
  dateProperty: 'date',
  timeFrame: 'last-30',
  granularity: 'daily',
  columns: 3,
  firstDayOfWeek: 'monday',
  animationDuration: 500,
  showConfetti: true,
  defaultVisualization: 'line',
  showEmptyDates: false,
};

export const DEFAULT_CARD_CONFIG: Omit<CardConfig, 'id' | 'propertyName' | 'order'> = {
  visualization: 'line',
  colorScheme: 'green',
  scale: { auto: true, min: 0, max: 100 },
  referenceLines: [],
  aggregation: 'average',
  movingAverage: null,
  showLegend: true,
  showGrid: true,
  hidden: false,
};

export const COLOR_SCHEMES: Record<ColorScheme, { bg: string; levels: string[] }> = {
  green: { bg: '#161b22', levels: ['#0e4429', '#006d32', '#26a641', '#39d353'] },
  blue: { bg: '#161b22', levels: ['#0a3069', '#0550ae', '#1f6feb', '#58a6ff'] },
  purple: { bg: '#161b22', levels: ['#3b1261', '#6e40c9', '#8957e5', '#bc8cff'] },
  orange: { bg: '#161b22', levels: ['#5a1e02', '#bd561d', '#db6d28', '#f0883e'] },
  red: { bg: '#161b22', levels: ['#67060c', '#bd2c00', '#da3633', '#f85149'] },
};
