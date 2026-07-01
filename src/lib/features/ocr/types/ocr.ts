/**
 * OCR feature types — verbatim from ocr-data-model.md.
 *
 * No runtime code — interfaces and union literals only.
 */

// ─── Word / Result ────────────────────────────────────────────────────────────

export interface OcrWord {
  text: string;
  /** 0.0–1.0 */
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  /** Page index for multi-page (PDF) documents */
  page?: number;
}

export interface OcrResult {
  /** Full document text, joined with newlines between words */
  rawText: string;
  words: OcrWord[];
  /** ISO 639-1 code (e.g. 'en', 'am') */
  language: string;
  /** e.g. 'tesseract-5.3.0-eng' */
  modelVersion: string;
  /** 1 for single images */
  pageCount: number;
  /** Inference time in ms */
  durationMs: number;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export type OcrJobStatus = 'queued' | 'running' | 'complete' | 'error';

export interface OcrJob {
  /** generatePrefixedId('ocr') */
  id: string;
  /** Canonicalized absolute path (validated before sidecar invocation) */
  imagePath: string;
  language: string;
  modelPath: string;
  status: OcrJobStatus;
  result?: OcrResult;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// ─── Corrections ──────────────────────────────────────────────────────────────

export type CorrectionSource = 'user' | 'llm';

export interface CorrectionEntry {
  /** SHA-256 of image bytes (not file path — survives moves) */
  imageHash: string;
  language: string;
  /** The original incorrect text */
  rawOcr: string;
  /** The user/LLM-corrected text */
  corrected: string;
  /** Unix timestamp */
  timestamp: number;
  source: CorrectionSource;
}
