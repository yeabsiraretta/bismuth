import { derived } from 'svelte/store';
import { settings } from '@/features/settings';

/**
 * Current application locale derived from BismuthSettings.
 * Read this store to get the active language code.
 * Write via settings.update({ language: 'en' }) — not directly.
 */
export const locale = derived(settings, ($s) => $s.language);

/** Available locale codes (only 'en' in this release). */
export const AVAILABLE_LOCALES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
];
