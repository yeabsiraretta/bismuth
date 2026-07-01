/**
 * OCR settings derived store — T04.
 *
 * Derives OCR-specific settings from the main settings store so consumers
 * can subscribe to only OCR-related fields without depending on the full
 * BismuthSettings shape.
 */

import { derived } from 'svelte/store';
import { settings } from '@/features/settings';

export interface OcrSettingsSlice {
  ocrEnabled: boolean;
  ocrDefaultLanguage: string;
  ocrLlmCorrection: boolean;
  ocrLlmCloudEnabled: boolean;
  ocrModelPath: string;
  ocrAmharicModelPath: string;
}

export const ocrSettings = derived(settings, ($s): OcrSettingsSlice => {
  const r = $s as unknown as Record<string, unknown>;
  return {
    ocrEnabled: (r['ocrEnabled'] as boolean) ?? false,
    ocrDefaultLanguage: (r['ocrDefaultLanguage'] as string) ?? 'en',
    ocrLlmCorrection: (r['ocrLlmCorrection'] as boolean) ?? false,
    ocrLlmCloudEnabled: (r['ocrLlmCloudEnabled'] as boolean) ?? false,
    ocrModelPath: (r['ocrModelPath'] as string) ?? '',
    ocrAmharicModelPath: (r['ocrAmharicModelPath'] as string) ?? '',
  };
});
