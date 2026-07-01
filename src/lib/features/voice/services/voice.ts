import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { RecordingMetadata } from '../types';

/**
 * Checks if the browser supports audio recording via MediaRecorder API.
 */
export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof navigator.mediaDevices !== 'undefined';
}

/**
 * Generates a filename following the pattern `recording-YYYY-MM-DD-HHmmss.<ext>`.
 */
export function generateRecordingFilename(mimeType: string): string {
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp3') ? 'mp3' : 'webm';
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const datePart = [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
  const timePart = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join('');
  return `recording-${datePart}-${timePart}.${ext}`;
}

/**
 * Saves a recorded audio blob to the vault filesystem.
 * Returns the metadata of the saved recording.
 */
export async function saveRecording(
  audioData: ArrayBuffer,
  duration: number,
  mimeType: string
): Promise<RecordingMetadata> {
  const filename = generateRecordingFilename(mimeType);
  log.info('Voice: saving recording', { duration, mimeType, filename });
  try {
    const uint8 = new Uint8Array(audioData);
    return await invoke<RecordingMetadata>('save_voice_recording', {
      data: Array.from(uint8),
      duration,
      mimeType,
      filename,
    });
  } catch (error) {
    log.error('Voice: failed to save recording', error as Error);
    throw new Error(`Failed to save recording: ${error}`);
  }
}

/**
 * Lists all recordings in the vault.
 */
export async function listRecordings(): Promise<RecordingMetadata[]> {
  try {
    return await invoke<RecordingMetadata[]>('list_voice_recordings');
  } catch (error) {
    log.error('Voice: failed to list recordings', error as Error);
    throw new Error(`Failed to list recordings: ${error}`);
  }
}

/**
 * Deletes a recording from the vault.
 */
export async function deleteRecording(recordingId: string): Promise<void> {
  log.info('Voice: deleting recording', { recordingId });
  try {
    await invoke('delete_voice_recording', { recordingId });
  } catch (error) {
    log.error('Voice: failed to delete recording', error as Error);
    throw new Error(`Failed to delete recording: ${error}`);
  }
}

/**
 * Attaches a recording to a note (adds embed link to note content).
 */
export async function attachRecordingToNote(recordingId: string, notePath: string): Promise<void> {
  log.info('Voice: attaching to note', { recordingId, notePath });
  try {
    await invoke('attach_voice_recording', { recordingId, notePath });
  } catch (error) {
    log.error('Voice: failed to attach recording', error as Error);
    throw new Error(`Failed to attach recording: ${error}`);
  }
}
