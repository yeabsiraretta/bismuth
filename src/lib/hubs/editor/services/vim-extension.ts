import type { Extension } from '@codemirror/state';

import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
import { registerDeferredExtension } from '@/hubs/editor/services/lazy-extensions';

registerDeferredExtension(async (): Promise<Extension | Extension[]> => {
  const settings = getSettings();
  if (!settings.vim.vimMode) return [];

  const { vim } = await import('@replit/codemirror-vim');
  return vim();
});
