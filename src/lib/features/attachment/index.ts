/**
 * Attachment management feature — public barrel export.
 * External consumers MUST import only from this path.
 */

// Types
export type {
  RootPathMode,
  AttachmentConfig,
  AttachmentOverride,
  OriginalNameEntry,
  AttachmentPathContext,
  RearrangeResult,
} from './types';
export { DEFAULT_ATTACHMENT_CONFIG, ATTACHMENT_VARIABLES } from './types';

// Store
export {
  attachmentConfig,
  attachmentOverrides,
  originalNames,
  updateAttachmentConfig,
  resetAttachmentConfig,
  setOverride,
  removeOverride,
  resetOverridesForPath,
  clearOverrides,
  clearOriginalNames,
  recordOriginalName,
  getOriginalName,
  pruneOriginalNames,
} from './stores/attachmentStore';

// Services — path resolver
export {
  formatDate,
  expandVariables,
  sanitizePath,
  resolveRootPath,
  findOverride,
  isExcludedPath,
  isExcludedExtension,
  buildAttachmentPath,
  buildContext,
  extractNoteName,
  extractDir,
  extractParent,
} from './services/pathResolver';

// Services — MD5
export { computeMd5Hex } from './services/md5';

// Services — rearrange
export {
  extractAttachmentLinks,
  resolveLink,
  rearrangeNoteAttachments,
  rearrangeAllAttachments,
} from './services/rearrange';
