/**
 * Design Documents service — barrel exports.
 */

export { readDocument, writeDocument, listDocuments, deleteDocument } from './store';
export {
  validateDocument,
  isValidEnvelope,
  isValidTokenPayload,
  isValidComponentPayload,
  isValidLayoutPayload,
  isValidFlowPayload,
  isValidThemePayload,
  isValidPagePayload,
} from './validation';
export { computeDiff, computeDocumentDiff } from './diffEngine';
export type { PatchOperation, DesignDocDiff } from './diffEngine';
export { saveVersion, listVersions, getVersion, rollbackToVersion } from './versionStore';
export type { VersionEntry, DocumentHistory } from './versionStore';
export {
  reflectAll,
  reflectTokensFromCSS,
  reflectComponentFromSvelte,
  reflectLayoutFromCSS,
  reflectThemeFromCSS,
} from './reflectors';
export { injectToCanvas } from './canvasInjector';
export type { CanvasElementBlueprint, InjectionResult } from './canvasInjector';
export { createDocumentEnvelope } from './envelope';
export type { EnvelopeOptions } from './envelope';
