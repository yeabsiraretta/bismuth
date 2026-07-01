/**
 * OCR IPC service — all invoke() calls for OCR are confined to this file.
 */

import { invoke } from '@tauri-apps/api/core';
import { log } from '@/utils/logger';
import type { CorrectionEntry } from '../types/ocr';

export async function importImage(
  sourcePath: string,
  language: string,
  vaultRoot: string
): Promise<{ jobId: string; stagedPath: string; language: string }> {
  log.info('[ocr] importImage', { sourcePath, language });
  return invoke('import_image', { sourcePath, language, vaultRoot });
}

export async function cleanupOcrTemp(
  stagedPath: string,
  vaultRoot: string
): Promise<void> {
  log.info('[ocr] cleanupOcrTemp', { stagedPath });
  return invoke('cleanup_ocr_temp', { stagedPath, vaultRoot });
}

export async function appendCorrection(
  vaultRoot: string,
  language: string,
  entry: CorrectionEntry
): Promise<void> {
  log.info('[ocr] appendCorrection', { language });
  return invoke('append_ocr_correction', { vaultRoot, language, entry });
}

export async function getCorrections(
  vaultRoot: string,
  language: string,
  n: number
): Promise<CorrectionEntry[]> {
  log.info('[ocr] getCorrections', { language, n });
  return invoke('get_ocr_corrections', { vaultRoot, language, n });
}

export async function applyLlmCorrection(jobId: string): Promise<string> {
  log.info('[ocr] applyLlmCorrection', { jobId });
  return invoke<string>('apply_llm_correction', { jobId });
}
