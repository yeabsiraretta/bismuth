import { writable, derived, get } from 'svelte/store';
import {
  isRecordingSupported,
  saveRecording,
  listRecordings,
  deleteRecording,
  attachRecordingToNote,
} from '../services/voice';
import type { RecordingMetadata, RecordingState } from '../types';
import { log } from '@/utils/logger';

/** Current recording state */
export const recordingState = writable<RecordingState>('idle');

/** Elapsed recording time in seconds */
export const recordingDuration = writable(0);

/** All saved recordings in the vault */
export const recordings = writable<RecordingMetadata[]>([]);

/** Whether voice recording is supported in this environment */
export const voiceSupported = writable(isRecordingSupported());

/** Loading state */
export const voiceLoading = writable(false);

/** Derived: is currently recording */
export const isRecording = derived(recordingState, ($s) => $s === 'recording');

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let durationInterval: ReturnType<typeof setInterval> | null = null;

/** Start audio recording */
export async function startRecording(): Promise<void> {
  if (!isRecordingSupported()) {
    log.warn('Voice recording not supported in this environment');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.start(1000);
    recordingState.set('recording');
    recordingDuration.set(0);

    durationInterval = setInterval(() => {
      recordingDuration.update((d) => d + 1);
    }, 1000);

    log.info('Voice recording started');
  } catch (error) {
    log.error('Voice: failed to start recording', error as Error);
    throw new Error(`Failed to start recording: ${error}`);
  }
}

/** Pause the current recording */
export function pauseRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    recordingState.set('paused');
    if (durationInterval) clearInterval(durationInterval);
    durationInterval = null;
  }
}

/** Resume a paused recording */
export function resumeRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    recordingState.set('recording');
    durationInterval = setInterval(() => {
      recordingDuration.update((d) => d + 1);
    }, 1000);
  }
}

/** Stop recording and save the audio file */
export async function stopRecording(): Promise<RecordingMetadata | null> {
  if (!mediaRecorder) return null;

  return new Promise((resolve) => {
    mediaRecorder!.onstop = async () => {
      if (durationInterval) clearInterval(durationInterval);
      durationInterval = null;

      const duration = get(recordingDuration);
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();

      voiceLoading.set(true);
      try {
        const metadata = await saveRecording(arrayBuffer, duration, 'audio/webm');
        recordings.update((list) => [metadata, ...list]);
        log.info('Voice recording saved', { duration, id: metadata.id });
        resolve(metadata);
      } catch (error) {
        log.error('Voice: failed to save after stop', error as Error);
        resolve(null);
      } finally {
        voiceLoading.set(false);
        recordingState.set('idle');
        recordingDuration.set(0);
      }

      // Stop all tracks
      mediaRecorder!.stream.getTracks().forEach((track) => track.stop());
      mediaRecorder = null;
      audioChunks = [];
    };

    mediaRecorder!.stop();
  });
}

/** Cancel recording without saving */
export function cancelRecording(): void {
  if (mediaRecorder) {
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    mediaRecorder = null;
    audioChunks = [];
  }
  if (durationInterval) clearInterval(durationInterval);
  durationInterval = null;
  recordingState.set('idle');
  recordingDuration.set(0);
}

/** Load all recordings from vault */
export async function loadRecordings(): Promise<void> {
  voiceLoading.set(true);
  try {
    const list = await listRecordings();
    recordings.set(list);
  } catch {
    recordings.set([]);
  } finally {
    voiceLoading.set(false);
  }
}

/** Delete a recording */
export async function removeRecording(recordingId: string): Promise<void> {
  await deleteRecording(recordingId);
  recordings.update((list) => list.filter((r) => r.id !== recordingId));
}

/** Attach a recording to the active note */
export async function attachToNote(recordingId: string, notePath: string): Promise<void> {
  await attachRecordingToNote(recordingId, notePath);
  recordings.update((list) =>
    list.map((r) => (r.id === recordingId ? { ...r, attachedNote: notePath } : r))
  );
}
