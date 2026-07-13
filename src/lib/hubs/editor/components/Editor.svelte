<script lang="ts">
  import { EditorState, Transaction } from '@codemirror/state';
  import { EditorView } from '@codemirror/view';
  import { redo as cmRedo, undo as cmUndo } from '@codemirror/commands';
  import { openSearchPanel, closeSearchPanel } from '@codemirror/search';
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';

  import {
    buildExtensions,
    createCompartments,
    reconfigureFromConfig,
    type EditorCompartments,
  } from '@/hubs/editor/services/extension-registry';
  import { loadDeferredExtensions } from '@/hubs/editor/services/lazy-extensions';
  import '@/hubs/editor/services/deferred-decorations';
  import '@/hubs/editor/services/enhanced-copy-extension';
  import '@/hubs/editor/services/vim-extension';
  import { DEFAULT_EDITOR_CONFIG, type EditorConfig } from '@/hubs/editor/types/editor-config';
  import { log } from '@/utils/log/logger';

  let {
    content = '',
    config = DEFAULT_EDITOR_CONFIG,
    tabId = '',
    onContentChange = undefined,
  }: {
    content?: string;
    config?: EditorConfig;
    tabId?: string;
    onContentChange?: ((content: string) => void) | undefined;
  } = $props();

  interface TabCache {
    state: EditorState;
    compartments: EditorCompartments;
  }
  const stateCache = new SvelteMap<string, TabCache>();
  let currentTabId = '';

  let editorElement: HTMLDivElement = $state(null!);
  let view: EditorView | null = $state(null);
  let compartments: EditorCompartments | null = $state(null);
  let mounted = $state(false);

  const editorLog = log.child('editor');

  function scheduleDeferred(cmCompartments: EditorCompartments): void {
    const sched =
      typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 16);
    sched(() => {
      if (!view) return;
      loadDeferredExtensions({ view })
        .then((exts) => {
          if (view && exts.length > 0) {
            view.dispatch({ effects: cmCompartments.deferred.reconfigure(exts) });
          }
        })
        .catch((err) => editorLog.warn('Deferred extension load failed', { error: String(err) }));
    });
  }

  // Tab switch: save/restore EditorState to preserve undo history per tab
  $effect(() => {
    if (!view || !compartments || !tabId || tabId === currentTabId) return;

    if (currentTabId) {
      stateCache.set(currentTabId, { state: view.state, compartments });
    }

    const cached = stateCache.get(tabId);
    if (cached) {
      view.setState(cached.state);
      compartments = cached.compartments;
      editorLog.debug('Restored tab state', { tabId });
    } else {
      const cfg = untrack(() => config);
      const onChange = untrack(() => onContentChange);
      const doc = untrack(() => content);
      const newCompartments = createCompartments();
      const extensions = buildExtensions(cfg, newCompartments, onChange);
      view.setState(EditorState.create({ doc, extensions }));
      compartments = newCompartments;
      scheduleDeferred(newCompartments);
      editorLog.debug('Created fresh tab state', { tabId });
    }

    currentTabId = tabId;
  });

  // Content sync for same-tab external updates (e.g. file watcher)
  $effect(() => {
    if (!view || !tabId || tabId !== currentTabId) return;
    if (content !== view.state.doc.toString()) {
      try {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: content },
          annotations: Transaction.addToHistory.of(false),
        });
      } catch (err) {
        editorLog.error('Content sync failed', err);
      }
    }
  });

  // Reconfigure editor settings
  $effect(() => {
    if (mounted && view && compartments) {
      try {
        reconfigureFromConfig(view, config, compartments);
      } catch (err) {
        editorLog.error('Settings reconfigure failed', err);
      }
    }
  });

  // Mount: create initial EditorView
  $effect(() => {
    if (!editorElement) return;

    const initialConfig = untrack(() => config);
    const initialContent = untrack(() => content);
    const initialOnChange = untrack(() => onContentChange);
    const initialTabId = untrack(() => tabId);

    const cmCompartments = createCompartments();
    compartments = cmCompartments;
    const extensions = buildExtensions(initialConfig, cmCompartments, initialOnChange);
    const state = EditorState.create({ doc: initialContent, extensions });
    view = new EditorView({ state, parent: editorElement });
    mounted = true;
    currentTabId = initialTabId;
    editorLog.info('Mounted');

    scheduleDeferred(cmCompartments);

    return () => {
      if (view && currentTabId) {
        stateCache.set(currentTabId, { state: view.state, compartments: cmCompartments });
      }
      view?.destroy();
      view = null;
      mounted = false;
    };
  });

  export function getContent(): string {
    return view?.state.doc.toString() ?? content;
  }

  export function getSelectedText(): string {
    if (!view) return '';
    const { from, to } = view.state.selection.main;
    return from === to ? '' : view.state.sliceDoc(from, to);
  }

  export function focus(): void {
    view?.focus();
  }

  export function undo(): boolean {
    return view ? cmUndo(view) : false;
  }

  export function redo(): boolean {
    return view ? cmRedo(view) : false;
  }

  export function scrollToLine(line: number): void {
    if (!view) return;
    const doc = view.state.doc;
    const lineNum = Math.min(line + 1, doc.lines);
    const pos = doc.line(lineNum).from;
    view.dispatch({
      selection: { anchor: pos },
      effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: 50 }),
    });
    view.focus();
  }

  export function openSearch(): void {
    if (view) openSearchPanel(view);
  }

  export function closeSearch(): void {
    if (view) closeSearchPanel(view);
  }

  export function toggleLinePrefix(prefix: string): void {
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const lineText = line.text;

    if (lineText.startsWith(prefix)) {
      view.dispatch({
        changes: { from: line.from, to: line.from + prefix.length, insert: '' },
        selection: { anchor: Math.max(line.from, from - prefix.length) },
      });
    } else {
      const existingHeading = lineText.match(/^#{1,6}\s/);
      const replaceFrom = line.from;
      const replaceTo = existingHeading ? line.from + existingHeading[0].length : line.from;
      view.dispatch({
        changes: { from: replaceFrom, to: replaceTo, insert: prefix },
        selection: { anchor: from + prefix.length - (replaceTo - replaceFrom) },
      });
    }
    view.focus();
  }

  export function replaceSelection(transform: (text: string) => string): void {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    if (from === to) return;
    const selected = view.state.sliceDoc(from, to);
    const replacement = transform(selected);
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from, head: from + replacement.length },
    });
    view.focus();
  }

  export function insertAtCursor(prefix: string, suffix = ''): void {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: {
        anchor: from + prefix.length,
        head: from + prefix.length + (selected || 'text').length,
      },
    });
    view.focus();
  }
</script>

<div class="editor-container" bind:this={editorElement}></div>

<style>
  .editor-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--color-background);
    color: var(--color-text);
  }
  .editor-container :global(.cm-editor) {
    height: 100%;
  }
  .editor-container :global(.cm-scroller) {
    overflow: auto;
  }
</style>
