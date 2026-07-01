/**
 * Media editing types — operation chain, operations, and filter presets.
 * Non-destructive: originals are never overwritten; edits stored as JSON chains.
 */

export type PhotoOpType =
  | 'crop'
  | 'rotate'
  | 'flip'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'filter'
  | 'resize'
  | 'convert';

export type VideoOpType = 'trim' | 'split' | 'speed' | 'filter' | 'text-overlay';

export type FilterName = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'warm' | 'cool' | 'vignette';

export interface PhotoOperation {
  type: PhotoOpType;
  params: Record<string, number | string>;
}

export interface VideoOperation {
  type: VideoOpType;
  params: Record<string, number | string>;
}

export interface MediaEditChain {
  sourceHash: string;
  sourcePath: string;
  operations: (PhotoOperation | VideoOperation)[];
  exportFormat: string;
  exportQuality: number;
  isVideo: boolean;
  createdAt: number;
  modifiedAt: number;
}

/** A named filter preset with an associated CSS filter string. */
export interface FilterPreset {
  id: FilterName;
  name: string;
  cssFilter: string;
}

/** Built-in filter presets — 7 total covering common photo styles. */
export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', name: 'Original', cssFilter: '' },
  { id: 'grayscale', name: 'B&W', cssFilter: 'grayscale(1)' },
  { id: 'sepia', name: 'Sepia', cssFilter: 'sepia(1)' },
  { id: 'vintage', name: 'Vintage', cssFilter: 'sepia(0.3) contrast(1.1) brightness(0.9)' },
  { id: 'warm', name: 'Warm', cssFilter: 'sepia(0.2) saturate(1.4) brightness(1.05)' },
  { id: 'cool', name: 'Cool', cssFilter: 'hue-rotate(30deg) saturate(0.9)' },
  { id: 'vignette', name: 'Vignette', cssFilter: 'brightness(0.85)' },
];

/** CSS filter strings keyed by FilterName for direct lookup. */
export const FILTER_PRESET_MAP: Record<FilterName, string> = {
  none: '',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(1)',
  vintage: 'sepia(0.3) contrast(1.1) brightness(0.9)',
  warm: 'sepia(0.2) saturate(1.4) brightness(1.05)',
  cool: 'hue-rotate(30deg) saturate(0.9)',
  vignette: 'brightness(0.85)',
};

// ── Image Converter types ───────────────────────────────────────────────

export type ImageFormat = 'webp' | 'jpeg' | 'png';

export type ResizeMode = 'width' | 'height' | 'longest-edge' | 'shortest-edge' | 'fit' | 'fill';

export type FlipDirection = 'horizontal' | 'vertical';

export type BatchTarget = 'current-note' | 'vault';

export interface ConversionConfig {
  outputFormat: ImageFormat;
  quality: number;
  resizeEnabled: boolean;
  resizeMode: ResizeMode;
  resizeValue: number;
  flipEnabled: boolean;
  flipDirection: FlipDirection;
}

export interface RenameConfig {
  enabled: boolean;
  pattern: string;
  outputFolder: string;
}

export const DEFAULT_CONVERSION: ConversionConfig = {
  outputFormat: 'webp',
  quality: 85,
  resizeEnabled: false,
  resizeMode: 'width',
  resizeValue: 1024,
  flipEnabled: false,
  flipDirection: 'horizontal',
};

export const DEFAULT_RENAME: RenameConfig = {
  enabled: false,
  pattern: '{noteName}-{fileName}',
  outputFolder: '',
};

export const RENAME_VARIABLES = [
  '{noteName}',
  '{fileName}',
  '{date}',
  '{time}',
  '{index}',
] as const;

export const FORMAT_MIME_MAP: Record<ImageFormat, string> = {
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export const FORMAT_EXT_MAP: Record<ImageFormat, string> = {
  webp: '.webp',
  jpeg: '.jpg',
  png: '.png',
};
