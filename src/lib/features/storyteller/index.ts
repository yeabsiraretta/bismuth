/**
 * Storyteller Suite — story planning, worldbuilding, campaign play,
 * timeline management, and manuscript compilation.
 */

// ─── Entity types ───────────────────────────────────────────────────────────
export type {
  EntityType,
  RelationshipKind,
  StorytellerEntity,
  CustomFieldValue,
  CustomFieldDefinition,
  EntityRelationship,
  CharacterEntity,
  LocationEntity,
  EventEntity,
  SceneEntity,
  SceneBranch,
  SceneStatus,
  ChapterEntity,
  BookEntity,
  GroupEntity,
  EntityTypeMeta,
} from './types/entity';
export { ENTITY_TYPE_META, getEntityMeta } from './types/entity';

// ─── Story types ────────────────────────────────────────────────────────────
export type { StorytellerConfig, Story, DashboardView } from './types/story';
export { DEFAULT_STORYTELLER_CONFIG } from './types/story';

// ─── Timeline types ─────────────────────────────────────────────────────────
export type {
  TimelineMode,
  TimelineGroupBy,
  TimelineEvent,
  TimelineDependency,
  TimelineEra,
  TimelineFork,
  TimelineConflict,
  TimelineFilter,
} from './types/timeline';
export { DEFAULT_TIMELINE_FILTER } from './types/timeline';

// ─── Campaign types ─────────────────────────────────────────────────────────
export type {
  Campaign,
  PartyMember,
  Condition,
  InventoryItem,
  SessionNote,
  SessionLogEntry,
  SceneGraphNode,
  SceneGraphEdge,
  LoreSurface,
} from './types/campaign';

// ─── Compile types ──────────────────────────────────────────────────────────
export type {
  CompileOutputFormat,
  CompileStep,
  CompileStepType,
  CompileWorkflow,
  CompileResult,
} from './types/compile';
export { BUILTIN_WORKFLOWS } from './types/compile';

// ─── Map types ──────────────────────────────────────────────────────────────
export type { MapMode, StoryMap, MapMarker, MapPortal, MapBreadcrumb } from './types/map';

// ─── Plotline types ─────────────────────────────────────────────────────────
export type {
  Plotline,
  NarrativeMode,
  BeatSheetTemplate,
  BeatDefinition,
  BeatSheet,
  SetupPayoff,
  PlotgridCell,
  PlotgridRow,
  SwimlaneSetting,
  SceneColorMode,
  ColorScheme,
} from './types/plotline';
export { BUILTIN_BEAT_SHEETS, NARRATIVE_MODE_LABELS } from './types/plotline';

// ─── Project types ──────────────────────────────────────────────────────────
export type {
  Series,
  BookInSeries,
  WritingGoals,
  WritingSprint,
  WritingSession,
  WritingStreak,
  ArchivedScene,
  ViewSnapshot,
  ExportFormat,
  ExportScope,
  ExportOptions,
  ResearchPostType,
  ResearchPost,
  StickyNoteTheme,
  CorkboardNote,
  CustomSceneFieldType,
  CustomSceneField,
  FocusModeSettings,
  CodexCategory,
  PlotHoleCategory,
  PlotHoleWarning,
} from './types/project';
export {
  DEFAULT_WRITING_GOALS,
  DEFAULT_EXPORT_OPTIONS,
  DEFAULT_FOCUS_MODE,
  BUILTIN_CODEX_CATEGORIES,
} from './types/project';

// ─── Story store ────────────────────────────────────────────────────────────
export {
  storytellerConfig,
  stories,
  activeStoryId,
  dashboardView,
  activeStory,
  isOneStoryMode,
  selectStory,
  addStory,
  removeStory,
  editStory,
  updateConfig,
  resetConfig,
  setDashboardView,
} from './stores/storyStore';

// ─── Entity store ───────────────────────────────────────────────────────────
export {
  allEntities,
  allRelationships,
  customFields,
  activeEntityId,
  entityTypeFilter,
  storyEntities,
  filteredEntities,
  activeEntity,
  activeEntityRelationships,
  entityCountsByType,
  addEntity,
  editEntity,
  removeEntity,
  selectEntity,
  addRelationship,
  removeRelationship,
  setTypeFilter,
  saveCustomField,
} from './stores/entityStore';

// ─── Timeline store ─────────────────────────────────────────────────────────
export {
  timelineEvents,
  timelineEras,
  timelineForks,
  timelineFilter,
  timelineMode,
  filteredEvents,
  groupedEvents,
  timelineConflicts,
  allTracks,
  addTimelineEvent,
  editTimelineEvent,
  removeTimelineEvent,
  addEra,
  removeEra,
  addFork,
  updateFilter,
  resetFilter,
  setTimelineMode,
} from './stores/timelineStore';

// ─── Campaign store ─────────────────────────────────────────────────────────
export {
  campaigns,
  sessionNotes,
  activeCampaignId,
  activeCampaign,
  storyCampaigns,
  activeSessions,
  activeSessionLog,
  createNewCampaign,
  selectCampaign,
  removeCampaign,
  addPartyMember,
  updateMemberHp,
  toggleMemberActive,
  addMemberCondition,
  removeMemberCondition,
  addItem,
  removeItem,
  assignOwner,
  addLog,
  setActiveScene,
  addSession,
} from './stores/campaignStore';

// ─── Plotline store ─────────────────────────────────────────────────────────
export {
  allPlotlines,
  allSetups,
  plotgridCells,
  storyPlotlines,
  unresolvedSetups,
  addPlotline,
  editPlotline,
  removePlotline,
  addSceneToPlotline,
  removeSceneFromPlotline,
  addSetup,
  resolveSetup,
  removeSetup,
  setPlotgridCell,
} from './stores/plotlineStore';

// ─── Stats store ────────────────────────────────────────────────────────────
export {
  writingGoals,
  writingSprint,
  writingStreak,
  writingSessions,
  statsRange,
  goalProgress,
  rangedSessions,
  totalWordsInRange,
  updateGoals,
  startSprint,
  endSprint,
  cancelSprint,
  recordWritingSession,
  setStatsRange,
} from './stores/statsStore';

// ─── Project store ──────────────────────────────────────────────────────────
export {
  allSeries,
  archivedScenes,
  corkboardNotes,
  researchPosts,
  viewSnapshots,
  codexCategories,
  storyCorkboardNotes,
  storyResearchPosts,
  storySnapshots,
  createSeries,
  addBookToSeries,
  removeBookFromSeries,
  archiveScene,
  restoreScene,
  addCorkboardNote,
  addImageNote,
  updateCorkboardNote,
  removeCorkboardNote,
  convertNoteToScene,
  addResearchPost,
  removeResearchPost,
  saveSnapshot,
  deleteSnapshot,
  addCodexCategory,
  removeCodexCategory,
} from './stores/projectStore';

// ─── Services ───────────────────────────────────────────────────────────────
export {
  loadConfig,
  saveConfig,
  loadStories,
  createStory,
  getEntityFolderPath,
  deleteStory,
  updateStory,
} from './services/storyService';

export {
  loadEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  getEntitiesByStory,
  getEntitiesByType,
  getEntityById,
  loadRelationships,
  createRelationship,
  deleteRelationship,
  getRelationshipsForEntity,
} from './services/entityService';

export {
  filterTimelineEvents,
  groupEvents,
  detectConflicts,
  getDependencyChain,
  createTimelineEvent,
} from './services/timelineService';

export {
  loadCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addInventoryItem,
  removeInventoryItem,
  assignItemOwner,
  addLogEntry,
  createSessionNote,
  surfaceLore,
} from './services/campaignService';

export {
  loadWorkflows,
  persistCustomWorkflows,
  createWorkflow,
  executeWorkflow,
} from './services/compileService';

export {
  loadPlotlines,
  persistPlotlines,
  createPlotline,
  loadSetups,
  persistSetups,
  createSetup,
  getUnresolvedSetups,
  loadPlotgridCells,
  persistPlotgridCells,
  getPlotgridCellKey,
  getBeatSheets,
  getBeatSheet,
  scanLinks,
  buildSubwayMap,
} from './services/plotlineService';
export type { ScannedLink, SubwayMapLane } from './services/plotlineService';

export {
  loadSessions,
  recordSession,
  getSessionsByRange,
  loadStreak,
  updateStreak,
  loadGoals,
  saveGoals,
  loadSprint,
  saveSprint,
  getGoalProgress,
  analyzePacing,
  detectPlotHoles,
  analyzeReadability,
} from './services/statsService';
export type { PacingData, ReadabilityScore } from './services/statsService';

export { exportProject } from './services/exportService';
export type { ExportResult } from './services/exportService';

// ─── Components ─────────────────────────────────────────────────────────────
export { default as StorytellerDashboard } from './components/StorytellerDashboard.svelte';
export { default as EntityPanel } from './components/EntityPanel.svelte';
export { default as TimelinePanel } from './components/TimelinePanel.svelte';
export { default as CampaignPanel } from './components/CampaignPanel.svelte';
export { default as CompilePanel } from './components/CompilePanel.svelte';
export { default as StoryBoard } from './components/StoryBoard.svelte';
export { default as PlotgridView } from './components/views/PlotgridView.svelte';
export { default as PlotlineMapView } from './components/views/PlotlineMapView.svelte';
export { default as ManuscriptView } from './components/views/ManuscriptView.svelte';
export { default as StatsView } from './components/views/StatsView.svelte';
export { default as NavigatorPanel } from './components/views/NavigatorPanel.svelte';
export { default as ExportPanel } from './components/views/ExportPanel.svelte';
export { default as CorkboardView } from './components/views/CorkboardView.svelte';
