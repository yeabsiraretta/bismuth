/**
 * OCR job queue store.
 *
 * Tracks in-flight and completed OCR jobs. Listens for Tauri events to update
 * job state reactively.
 */

import { writable, derived } from 'svelte/store';
import { log } from '@/utils/logger';
import type { OcrJob } from '../types/ocr';
import { settings } from '@/features/settings';

// ─── State ────────────────────────────────────────────────────────────────────

export const activeJobs = writable<OcrJob[]>([]);
export const activeJobId = writable<string | null>(null);

// ─── Derived ──────────────────────────────────────────────────────────────────

export const ocrEnabled = derived(settings, ($s) => ($s as { ocrEnabled?: boolean }).ocrEnabled ?? false);

// ─── Actions ──────────────────────────────────────────────────────────────────

export function addJob(job: OcrJob): void {
  activeJobs.update((jobs) => [...jobs, job]);
  log.info('[ocrStore] addJob', { id: job.id, status: job.status });
}

export function updateJob(id: string, patch: Partial<OcrJob>): void {
  activeJobs.update((jobs) =>
    jobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
  );
  log.debug('[ocrStore] updateJob', { id });
}

export function removeJob(id: string): void {
  activeJobs.update((jobs) => jobs.filter((j) => j.id !== id));
  activeJobId.update((curr) => (curr === id ? null : curr));
  log.info('[ocrStore] removeJob', { id });
}

export function clearCompleted(): void {
  activeJobs.update((jobs) =>
    jobs.filter((j) => j.status !== 'complete' && j.status !== 'error')
  );
  log.info('[ocrStore] clearCompleted');
}
