/**
 * Life Tracker feature — capture and visualize life data from frontmatter.
 * Public API barrel.
 */

// Types
export type {
  PropertyType,
  VisualizationType,
  ColorScheme,
  TimeGranularity,
  AggregationMethod,
  FirstDayOfWeek,
  TimeFrame,
  PropertyDefinition,
  PropertyConstraints,
  ValueMapping,
  NoteFilter,
  DataPoint,
  AggregatedPoint,
  HeatmapCell,
  TrendInfo,
  ScaleConfig,
  ReferenceLine,
  CardConfig,
  OverlayConfig,
  VisualizationPreset,
  TrackerSettings,
  CaptureState,
} from './types';

export { DEFAULT_TRACKER_SETTINGS, DEFAULT_CARD_CONFIG, COLOR_SCHEMES } from './types';

// Services
export {
  loadNoteMeta,
  extractDataPoints,
  extractAllProperties,
  extractDate,
  timeFrameRange,
  isInTimeFrame,
} from './services/dataExtractor';
export type { NoteMeta } from './services/dataExtractor';

export {
  aggregateTimeSeries,
  movingAverage,
  computeTrend,
  buildHeatmap,
  heatmapColor,
  countListValues,
  detectScale,
  formatDateLabel,
} from './services/aggregation';

export {
  validateValue,
  coerceValue,
  savePropertyValue,
  saveAllProperties,
  missingProperties,
  isComplete,
  completionPercent,
} from './services/capture';

// Stores
export {
  propertyDefs,
  trackerSettings,
  cardConfigs,
  overlayConfigs,
  vizPresets,
  trackerData,
  trackerLoading,
  captureState,
  definedPropertyNames,
  visibleCards,
  captureProgress,
  refreshTrackerData,
  addPropertyDef,
  updatePropertyDef,
  removePropertyDef,
  reorderPropertyDefs,
  updateCardConfig,
  removeCard,
  reorderCards,
  addOverlay,
  updateOverlay,
  removeOverlay,
  startCapture,
  startBatchCapture,
  closeCapture,
  setTimeFrame,
} from './stores/trackerStore';

// Components
export { default as TrackerDashboard } from './components/TrackerDashboard.svelte';
export { default as HeatmapCard } from './components/views/HeatmapCard.svelte';
export { default as ChartCard } from './components/views/ChartCard.svelte';
export { default as PieCard } from './components/views/PieCard.svelte';
export { default as CaptureModal } from './components/dialogs/CaptureModal.svelte';
