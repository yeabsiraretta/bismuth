/**
 * Pretty Properties feature module.
 * Makes note properties visually appealing with images, colors, and custom formatting.
 */

// Types
export type {
  CoverShape,
  CoverConfig,
  BannerConfig,
  IconConfig,
  IconSource,
  ResolvedIcon,
  PropertyColor,
  PropertyColorMap,
  TagColor,
  ProgressConfig,
  DateFormatConfig,
  RelativeDate,
  DateColorConfig,
  PropertyTemplate,
  HiddenProperties,
  PrettyPropertiesConfig,
} from './types/properties';
export { DEFAULT_PRETTY_PROPERTIES_CONFIG } from './types/properties';

// Services
export {
  resolveCoverSrc,
  getCoverDimensions,
  resolveIcon,
  formatDate,
  getRelativeDate,
  calculateProgress,
  getPropertyValueColor,
  setPropertyValueColor,
  getTagColor,
  renderPropertyTemplate,
  isPropertyHidden,
  togglePropertyHidden,
} from './services/propertyDisplay';

export {
  humanizeDuration,
  formatDuration,
  abbreviateDuration,
  abbreviateNumber,
} from './services/templateHelpers';

// Stores
export {
  prettyPropertiesConfig,
  revealHidden,
  isEnabled,
  hiddenProperties,
  propertyColors,
  tagColors,
  progressBars,
  templates,
  coverConfig,
  bannerConfig,
  iconConfig,
  dateFormatConfig,
  dateColorConfig,
  toggleEnabled,
  updateConfig,
  setCoverShape,
  setCoverWidth,
  setCoverProperty,
  setCoverFolder,
  setBannerHeight,
  setBannerFolder,
  setIconFolder,
  toggleHideProperty,
  toggleRevealAll,
  setPropertyColor,
  setTagColor,
  toggleColoredTagsInBody,
  toggleTextColorButton,
  setDateFormat,
  setDatetimeFormat,
  setDateColor,
  addProgressBar,
  removeProgressBar,
  setPropertyTemplate,
  removePropertyTemplate,
  getTemplate,
} from './stores/propertyStore';

// Components
export { default as PrettyPropertiesPanel } from './components/PrettyPropertiesPanel.svelte';
export { default as PropertyRow } from './components/PropertyRow.svelte';
