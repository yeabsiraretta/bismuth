/**
 * RPG Manager feature module.
 * System-agnostic campaign management for any TTRPG.
 */

// Types
export type {
  ElementType,
  RelationshipType,
  StoryCircleStage,
  NpcType,
  CharacterArc,
  SceneType,
  CustomAttributeType,
  StoryCircleEntry,
  Relationship,
  RpgTask,
  CustomAttribute,
  CustomAttributeValue,
  KishotenketsuEntry,
  ConflictEntry,
  RpgElement,
  RpgCampaign,
  ElementTypeMeta,
} from './types';

export {
  ELEMENT_META,
  ELEMENT_TYPE_ORDER,
  GLOBAL_ASSET_TYPES,
  NARRATIVE_TYPES,
  getElementMeta,
} from './types/elementMeta';

// Services
export {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  loadCampaigns,
  createElement,
  updateElement,
  deleteElement,
  getElementById,
  getElementsByCampaign,
  getElementsByType,
  getChildren,
  getGlobalAssets,
  reorderElements,
  getAllElements,
} from './services/elementService';

export {
  createRelationship,
  updateRelationship,
  deleteRelationship,
  deleteRelationshipsForElement,
  getRelationshipsForElement,
  getVisibleRelationships,
  getOtherElementId,
  areRelated,
  getAllRelationships,
} from './services/relationshipService';

export {
  STORY_CIRCLE_STAGES,
  createEmptyStoryCircle,
  isStoryCircleComplete,
  getStoryCircleProgress,
  createEmptyKishotenketsu,
  KISHOTENKETSU_LABELS,
  createEmptyConflict,
  createTask,
  toggleTask,
  deleteTask,
  getTasksForElement,
  getOpenTasksForCampaign,
  assignTaskToElement,
  createCustomAttribute,
  deleteCustomAttribute,
  getCustomAttributesForType,
  getAllCustomAttributes,
} from './services/narrativeService';

// Store
export {
  campaigns,
  activeCampaignId,
  activeElementId,
  elements,
  relationships,
  activeCampaign,
  activeElement,
  campaignElements,
  elementsByType,
  createNewCampaign,
  selectCampaign,
  removeCampaign,
  createNewElement,
  selectElement,
  updateActiveElement,
  removeElement,
  addRelationship,
  removeRelationship,
} from './stores/rpgStore';
