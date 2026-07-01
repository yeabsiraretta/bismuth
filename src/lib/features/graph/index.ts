/**
 * Graph visualization feature module.
 * Public API barrel.
 */

// Types
export type { GraphData, GraphNode, GraphEdge, GraphSettings, NodeColors, SmartConnection, ConnectionMode, SmartGraphSettings } from './types';

// Services
export type { Mention, BacklinksData, OutgoingLinksData, NodePosition, LayoutSettings, ConceptSuggestion } from './services/graph';
export {
  getGraphData,
  getBacklinks,
  getBacklinksData,
  getOutgoingLinks,
  createLinkFromMention,
  createLinkFromUnlinkedMention,
  getSimilarNotes,
  lookupByText,
  computeGraphLayout,
  getConceptSuggestions,
} from './services/graph';

// Smart Connections
export {
  DEFAULT_SMART_SETTINGS,
  getSmartConnections,
  buildSmartGraph,
  getRelevanceThickness,
  getRelevanceDistance,
  truncateLabel,
  getNoteExcerpt,
} from './services/smartConnections';

// Utils
export { filterGraphData, initNodes, tickForces, hitTestNode } from './utils/simulation';

// Session persistence
export { loadGraphSession, saveGraphSession, clearGraphSession } from './stores/graphSession';
export type { GraphSessionState } from './stores/graphSession';

// Analytics types
export type {
  NodeMetrics, TopicCluster, StructuralGap, Bigram,
  GraphAnalyticsResult, ConceptNode, ConceptEdge,
  ConceptMode, LinkMode, AnalyticsSettings,
} from './types/analytics';
export { DEFAULT_ANALYTICS_SETTINGS, CLUSTER_COLORS } from './types/analytics';

// Analytics services
export { betweennessCentrality, detectCommunities, detectGaps, extractBigrams, analyzeGraph } from './services/graphAnalytics';
export { extractWikilinks, extractConcepts, conceptFrequencies, topConcepts, buildConceptGraph, buildMultiSourceGraph } from './services/conceptExtractor';
export type { ContentSource } from './services/conceptExtractor';

// Analytics store
export {
  analyticsSettings, analyticsResult, analyticsLoading,
  selectedClusterId, selectedGapIdx, analyticsTab,
  highlightedNodes, clusters, gaps, topMetrics, modularity, bigrams,
  selectedCluster, selectedGap, clusterNodeMap,
  runAnalysis, selectCluster, selectGap, setAnalyticsTab,
  updateAnalyticsSettings, clearAnalytics,
} from './stores/analyticsStore';

// 3D Graph types
export type {
  NodeShape3D, NodeAppearance3D, SimNode3D, Camera3D,
  Graph3DSettings, Graph3DColorGroup, FocusState3D,
} from './types/graph3d';
export { DEFAULT_CAMERA, DEFAULT_3D_SETTINGS, DEFAULT_3D_NODE_COLORS, EMPTY_FOCUS } from './types/graph3d';

// 3D Graph utils
export {
  initNodes3D, tickForces3D, projectNode, projectAllNodes,
  hitTestNode3D, getAppearanceForType, getNodeColor3D, getNodeRadius3D, getNeighborIds,
} from './utils/simulation3d';

// 3D Graph session
export { load3DSession, save3DSession, clear3DSession } from './stores/graph3dSession';
export type { Graph3DSession } from './stores/graph3dSession';

// Components
export { default as GraphView } from './components/GraphView.svelte';
export { default as GraphSidebarPanel } from './components/GraphSidebarPanel.svelte';
export { default as SmartGraphView } from './components/smart/SmartGraphView.svelte';
export { default as AnalyticsView } from './components/analytics/AnalyticsView.svelte';
export { default as TopicsPanel } from './components/analytics/TopicsPanel.svelte';
export { default as GapsPanel } from './components/analytics/GapsPanel.svelte';
export { default as MetricsPanel } from './components/analytics/MetricsPanel.svelte';
export { default as Graph3DView } from './components/view3d/Graph3DView.svelte';
