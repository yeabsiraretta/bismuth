import type { SlotContract } from '@/types/layout';

/**
 * Named zone contracts for ResizablePanel.svelte.
 * ResizablePanel wraps left and right sidebar content.
 */
export const ResizablePanelSlots: SlotContract = {
  header: {
    name: 'header',
    description: 'Panel header strip — title, collapse toggle, panel-level actions.',
    mustNotContain: ['note content', 'canvas elements', 'feature-domain logic'],
    required: false,
  },
  content: {
    name: 'content',
    description: 'Scrollable panel body — the feature panel content (file tree, backlinks, etc.).',
    mustNotContain: ['global header chrome', 'status bar', 'toast notifications'],
    required: true,
  },
};
