/**
 * Template feature module — note template management.
 * Public API barrel.
 */

// Types (re-exported from service)
export type { Template, TemplatePrompt } from './services/template';

// Stores
export {
  templates,
  activeTemplate,
  templateLoading,
  favoriteTemplates,
  refreshTemplates,
  toggleFavorite,
  expandTemplateVariables,
  insertTemplateAtCursor,
  autoCreateFromTemplate,
} from './stores/template';

// Services
export {
  listTemplates,
  renderTemplate,
  renderTemplateAdvanced,
  buildTemplateContext,
  extractPrompts,
  createFromTemplate,
  saveTemplate,
  deleteTemplate,
} from './services/template';

// Components
export { default as TemplatePanel } from './components/TemplatePanel.svelte';
export { default as SmartTemplateModal } from './components/SmartTemplateModal.svelte';

// Smart Templates — types
export type {
  SmartTemplate,
  SmartTemplateConfig,
  PromptContext,
  BuiltPrompt,
  TemplateSource,
} from './types/smartTemplate';
export { DEFAULT_SMART_TEMPLATE_CONFIG, BUILTIN_TEMPLATES } from './types/smartTemplate';

// Smart Templates — services
export {
  buildPrompt,
  truncateContext,
  estimateTokens,
  buildContextFromNote,
  stripFrontmatter,
  contextPreview,
} from './services/promptBuilder';

export {
  discoverTemplates,
  isSmartTemplate,
  extractSmartTemplateContent,
  filterTemplates,
  groupBySource,
  SOURCE_LABELS,
} from './services/templateDiscovery';

// Smart Templates — store
export {
  smartTemplateConfig,
  updateSmartTemplateConfig,
  resetSmartTemplateConfig,
  availableSmartTemplates,
  refreshSmartTemplates,
  buildCurrentContext,
  buildSmartPrompt,
  recentPrompts,
  addRecentPrompt,
  clearRecentPrompts,
} from './stores/smartTemplateStore';
