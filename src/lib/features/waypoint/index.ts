/**
 * Waypoint feature module.
 * Automatic TOC/MOC generation for folder notes with nested waypoint pruning.
 */

// Types
export type {
  MarkerKind,
  MarkerTrigger,
  TocEntry,
  FolderNoteInfo,
  WaypointConfig,
} from './types/waypoint';
export { DEFAULT_WAYPOINT_CONFIG, beginMarker, endMarker, triggerComment } from './types/waypoint';

// Services
export {
  stemOf,
  parentDir,
  folderName,
  isFolderNote,
  findFolderNotes,
  findMarkers,
  getMarkerKind,
  collectTocEntries,
  renderToc,
  generateWaypointBlock,
  updateNoteContent,
  folderNoteContent,
  folderNotePath,
} from './services/waypointService';

// Stores
export {
  waypointConfig,
  waypointHidden,
  isProcessing,
  folderNoteIndex,
  isEnabled,
  hideInEditor,
  autoCreateFolderNotes,
  folderNoteCount,
  waypointCount,
  landmarkCount,
  toggleEnabled,
  toggleHideInEditor,
  toggleStopAtFolderNotes,
  toggleAutoCreateFolderNotes,
  toggleIncludeExtension,
  setWaypointTrigger,
  setLandmarkTrigger,
  setIndentString,
  updateConfig,
  scanFolderNotes,
  updateAllWaypoints,
  updateSingleWaypoint,
} from './stores/waypointStore';

// Components
export { default as WaypointPanel } from './components/WaypointPanel.svelte';
