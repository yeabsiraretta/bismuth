import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';

import { getSettings } from '@/hubs/core/stores/settings-store.svelte';
import {
  DEFAULT_ENHANCED_COPY_CONFIG,
  enhancedCopyTransform,
} from '@/hubs/editor/services/enhanced-copy';
import { registerDeferredExtension } from '@/hubs/editor/services/lazy-extensions';
import { log } from '@/utils/log/logger';

registerDeferredExtension(async (): Promise<Extension | Extension[]> => {
  return keymap.of([
    {
      key: 'Mod-Shift-c',
      run: (view) => {
        const selection = view.state.sliceDoc(
          view.state.selection.main.from,
          view.state.selection.main.to
        );
        if (!selection) return false;

        const settings = getSettings();
        const config = {
          ...DEFAULT_ENHANCED_COPY_CONFIG,
          tabToSpaces: settings.editor.insertSpaces,
          tabSize: settings.editor.tabSize,
        };

        const transformed = enhancedCopyTransform(selection, config);

        navigator.clipboard.writeText(transformed).catch((err) => {
          log.warn('Enhanced copy failed', { error: String(err) });
        });

        return true;
      },
    },
  ]);
});
