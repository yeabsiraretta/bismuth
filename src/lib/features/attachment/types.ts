/**
 * Attachment management types — path config, overrides, and variables.
 *
 * Path composition: {rootPath}/{attachmentPath}/{attachmentName}.ext
 *
 * Variables: ${notepath}, ${notename}, ${parent}, ${originalname},
 *            ${date}, ${md5}
 */

export type RootPathMode = 'obsidian' | 'fixed' | 'subfolder';

export interface AttachmentConfig {
  rootPathMode: RootPathMode;
  fixedRoot: string;
  subfolderName: string;
  attachmentPath: string;
  attachmentFormat: string;
  dateFormat: string;
  excludeExtensionPattern: string;
  autoRenameOnNoteRename: boolean;
  handleAllAttachments: boolean;
  excludePaths: string;
  excludeSubpaths: boolean;
}

export const DEFAULT_ATTACHMENT_CONFIG: AttachmentConfig = {
  rootPathMode: 'subfolder',
  fixedRoot: 'attachments',
  subfolderName: 'assets',
  attachmentPath: '${notepath}/${notename}',
  attachmentFormat: 'IMG-${date}',
  dateFormat: 'YYYYMMDDHHmmssSSS',
  excludeExtensionPattern: '',
  autoRenameOnNoteRename: true,
  handleAllAttachments: false,
  excludePaths: '',
  excludeSubpaths: false,
};

export interface AttachmentOverride {
  id: string;
  targetPath: string;
  targetType: 'file' | 'folder' | 'extension';
  attachmentPath: string;
  attachmentFormat: string;
  dateFormat: string;
}

export interface OriginalNameEntry {
  md5: string;
  originalName: string;
  addedAt: number;
}

export interface AttachmentPathContext {
  notePath: string;
  noteName: string;
  parentFolder: string;
  originalName: string;
  md5: string;
  date: Date;
}

export const ATTACHMENT_VARIABLES = [
  '${notepath}',
  '${notename}',
  '${parent}',
  '${originalname}',
  '${date}',
  '${md5}',
] as const;

export interface RearrangeResult {
  moved: number;
  skipped: number;
  errors: string[];
}
