import type { SlotContract } from '@/types/layout';

/**
 * Named zone contracts for App.svelte — the root layout shell.
 *
 * Rule: each zone has a single responsibility. Placing content in the wrong
 * zone breaks keyboard focus order, accessibility landmarks, and theme layering.
 */
export const AppLayoutSlots: SlotContract = {
  toolbar: {
    name: 'toolbar',
    description: 'Vault-level toolbar — file operations, vault switcher, global actions.',
    mustNotContain: ['canvas logic', 'note content', 'editor state', 'feature-specific panels'],
    required: true,
  },
  sidebar: {
    name: 'sidebar',
    description: 'Left and right sidebar shells — navigation panels, tool panels.',
    mustNotContain: ['note markdown content', 'canvas elements', 'modal dialogs'],
    required: false,
  },
  main: {
    name: 'main',
    description: 'Primary content area — note editor, canvas, graph, or feature view.',
    mustNotContain: ['global navigation', 'status bar content', 'toast notifications'],
    required: true,
  },
  statusBar: {
    name: 'statusBar',
    description: 'App-wide status strip — word count, cursor position, sync status.',
    mustNotContain: ['feature panels', 'navigation', 'modals'],
    required: false,
  },
  overlays: {
    name: 'overlays',
    description: 'Toast notifications, command palette, modal dialogs, confirm providers.',
    mustNotContain: ['persistent layout content', 'sidebar panels'],
    required: false,
  },
};
