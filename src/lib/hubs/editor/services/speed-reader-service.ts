/**
 * Speed Reader Service — text extraction and word tokenization for RSVP reading.
 *
 * Supports:
 * - Markdown notes (strip frontmatter, headings, links, formatting)
 * - Plain text files (.txt, .csv, .json, .xml)
 * - PDF text extraction (via Tauri IPC backend)
 * - OCR for images (.png, .jpg, .jpeg, .gif, .webp, .bmp, .tiff) via Tauri IPC
 */

import { invokeCommand } from '@/ipc/invoke';
import { isTauriAvailable } from '@/utils/platform';

// ── Types ────────────────────────────────────────────────────────

export interface SpeedReaderWord {
  /** The word text */
  text: string;
  /** Index of the Optimal Recognition Point (ORP) character */
  orpIndex: number;
}

export type FileKind = 'markdown' | 'text' | 'pdf' | 'image' | 'unsupported';

// ── File type detection ──────────────────────────────────────────

const MARKDOWN_EXTS = new Set(['md', 'markdown', 'mdx']);
const TEXT_EXTS = new Set([
  'txt',
  'csv',
  'json',
  'xml',
  'yml',
  'yaml',
  'toml',
  'log',
  'ini',
  'cfg',
  'conf',
  'rst',
  'adoc',
  'tex',
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'py',
  'rs',
  'go',
  'java',
  'c',
  'cpp',
  'h',
  'sh',
  'bat',
  'ps1',
  'rb',
  'php',
  'swift',
  'kt',
  'scala',
  'sql',
  'r',
  'lua',
  'pl',
  'ex',
  'exs',
  'hs',
  'ml',
  'fs',
  'clj',
  'erl',
  'elm',
  'dart',
  'vue',
  'svelte',
]);
const PDF_EXTS = new Set(['pdf']);
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'tif']);

function getExt(path: string): string {
  return path.split('.').pop()?.toLowerCase() ?? '';
}

export function detectFileKind(path: string): FileKind {
  const ext = getExt(path);
  if (MARKDOWN_EXTS.has(ext)) return 'markdown';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (PDF_EXTS.has(ext)) return 'pdf';
  if (IMAGE_EXTS.has(ext)) return 'image';
  return 'unsupported';
}

export function isReadable(path: string): boolean {
  return detectFileKind(path) !== 'unsupported';
}

// ── Markdown stripping ───────────────────────────────────────────

/**
 * Strip markdown formatting to extract plain readable text.
 * Removes: frontmatter, headings markers, bold/italic, links, images, code blocks,
 * inline code, HTML tags, horizontal rules, blockquote markers, list bullets.
 */
export function stripMarkdown(content: string): string {
  let text = content;

  // Remove frontmatter
  text = text.replace(/^---[\s\S]*?---\n?/, '');

  // Remove code blocks (fenced)
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/~~~[\s\S]*?~~~/g, '');

  // Remove inline code
  text = text.replace(/`[^`]*`/g, '');

  // Remove images ![alt](url) and ![alt][ref]
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/!\[[^\]]*\]\[[^\]]*\]/g, '');

  // Convert wikilinks [[target|display]] → display, [[target]] → target
  text = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');

  // Convert markdown links [text](url) → text
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold/italic markers
  text = text.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');

  // Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Remove highlight
  text = text.replace(/==(.*?)==/g, '$1');

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove blockquote markers
  text = text.replace(/^>\s?/gm, '');

  // Remove list bullets/numbers
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // Remove task checkboxes
  text = text.replace(/\[[ xX/\->!]\]\s*/g, '');

  // Remove footnote definitions
  text = text.replace(/^\[\^[^\]]+\]:\s*/gm, '');

  // Remove footnote references
  text = text.replace(/\[\^[^\]]+\]/g, '');

  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

// ── Text extraction ──────────────────────────────────────────────

/**
 * Extract text from a PDF file via Tauri backend.
 * Falls back to placeholder in browser environment.
 */
async function extractPdfText(path: string): Promise<string> {
  if (!isTauriAvailable()) {
    return '[PDF text extraction requires the desktop app]';
  }
  try {
    return await invokeCommand<string>('extract_pdf_text', { path });
  } catch {
    return '[Failed to extract text from PDF]';
  }
}

/**
 * Extract text from an image using OCR via Tauri backend.
 * Falls back to placeholder in browser environment.
 */
async function extractOcrText(path: string, language = 'eng'): Promise<string> {
  if (!isTauriAvailable()) {
    return '[OCR text extraction requires the desktop app]';
  }
  try {
    return await invokeCommand<string>('ocr_extract_text', { path, language });
  } catch {
    return '[Failed to extract text via OCR]';
  }
}

/**
 * Extract readable text from any supported file type.
 */
export async function extractText(path: string, rawContent?: string): Promise<string> {
  const kind = detectFileKind(path);

  switch (kind) {
    case 'markdown':
      if (rawContent) return stripMarkdown(rawContent);
      if (isTauriAvailable()) {
        try {
          const content = await invokeCommand<string>('read_file_text', { path });
          return stripMarkdown(content);
        } catch {
          return rawContent ? stripMarkdown(rawContent) : '';
        }
      }
      return rawContent ? stripMarkdown(rawContent) : '';

    case 'text':
      if (rawContent) return rawContent;
      if (isTauriAvailable()) {
        try {
          return await invokeCommand<string>('read_file_text', { path });
        } catch {
          return rawContent ?? '';
        }
      }
      return rawContent ?? '';

    case 'pdf':
      return extractPdfText(path);

    case 'image':
      return extractOcrText(path);

    default:
      return '';
  }
}

// ── Word tokenization ────────────────────────────────────────────

/**
 * Tokenize text into words, filtering out empty tokens and pure punctuation.
 */
export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0 && !/^[.,;:!?…—–\-(){}[\]"'`]+$/.test(w));
}

/**
 * Calculate the Optimal Recognition Point (ORP) index for a word.
 * This is the character the eye should focus on for fastest recognition.
 *
 * Based on Spritz algorithm:
 * - 1 char → index 0
 * - 2-5 chars → index 1
 * - 6-9 chars → index 2
 * - 10-13 chars → index 3
 * - 14+ chars → index 4
 */
export function calcOrp(word: string): number {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

/**
 * Convert raw text into SpeedReaderWord array with ORP indices.
 */
export function prepareWords(text: string): SpeedReaderWord[] {
  return tokenize(text).map((w) => ({
    text: w,
    orpIndex: calcOrp(w),
  }));
}

// ── WPM / timing utilities ───────────────────────────────────────

/**
 * Calculate delay in ms between words for a given WPM.
 * Adds extra pause for words ending in sentence-ending punctuation.
 */
export function wordDelay(wpm: number, word: string): number {
  const base = 60000 / wpm;
  // Add 50% pause after sentence-ending punctuation
  if (/[.!?;:]$/.test(word)) return base * 1.5;
  // Add 25% pause after comma
  if (/[,]$/.test(word)) return base * 1.25;
  return base;
}

/**
 * Estimate total reading time in seconds.
 */
export function estimateTime(wordCount: number, wpm: number): number {
  return Math.ceil((wordCount / wpm) * 60);
}

/**
 * Format seconds as m:ss.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
