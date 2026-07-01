/**
 * Music document IPC service.
 *
 * All invoke() calls for music document persistence are confined to this file.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { MusicDocument } from '../types/music';

export interface MusicDocumentMeta {
  id: string;
  name: string;
  created_at: string;
  modified_at: string;
  track_count: number;
}

export async function createMusicDocument(
  vaultPath: string,
  name: string
): Promise<MusicDocumentMeta> {
  log.info('[musicDoc] createMusicDocument', { name });
  return invoke<MusicDocumentMeta>('create_music_document', { vaultPath, name });
}

export async function loadMusicDocument(
  vaultPath: string,
  id: string
): Promise<MusicDocument> {
  log.info('[musicDoc] loadMusicDocument', { id });
  return invoke<MusicDocument>('load_music_document', { vaultPath, id });
}

export async function saveMusicDocument(
  vaultPath: string,
  doc: MusicDocument
): Promise<void> {
  log.info('[musicDoc] saveMusicDocument', { id: doc.id });
  return invoke<void>('save_music_document', { vaultPath, doc });
}

export async function listMusicDocuments(
  vaultPath: string
): Promise<MusicDocumentMeta[]> {
  log.info('[musicDoc] listMusicDocuments');
  return invoke<MusicDocumentMeta[]>('list_music_documents', { vaultPath });
}

export async function deleteMusicDocument(
  vaultPath: string,
  id: string
): Promise<void> {
  log.info('[musicDoc] deleteMusicDocument', { id });
  return invoke<void>('delete_music_document', { vaultPath, id });
}
