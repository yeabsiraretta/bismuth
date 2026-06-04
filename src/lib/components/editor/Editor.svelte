<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { EditorView, lineNumbers, drawSelection, dropCursor, keymap } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { wikilinkExtension } from './extensions/wikilink';

  export let content: string = '';
  export let readonly: boolean = false;
  export let onContentChange: ((content: string) => void) | undefined = undefined;
  export let onWikilinkClick: ((title: string) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{
    change: { content: string };
    save: { content: string };
  }>();

  let editorElement: HTMLDivElement;
  let view: EditorView | null = null;

  $: if (view && content !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }

  function createExtensions() {
    return [
      lineNumbers(),
      history(),
      drawSelection(),
      dropCursor(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown(),
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      wikilinkExtension(handleWikilinkClick),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          onContentChange?.(newContent);
          dispatch('change', { content: newContent });
        }
      }),
      EditorState.readOnly.of(readonly),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
          fontFamily: 'var(--font-monospace, "JetBrains Mono", monospace)',
        },
        '.cm-content': {
          padding: '16px 20px',
          caretColor: 'var(--interactive-accent, #89b4fa)',
        },
        '.cm-gutters': {
          background: 'var(--bg-secondary, #1e1e2e)',
          borderRight: '1px solid var(--border-color, #313244)',
          color: 'var(--text-faint, #585b70)',
        },
        '.cm-activeLineGutter': {
          background: 'var(--bg-hover, #313244)',
        },
        '.cm-activeLine': {
          background: 'var(--bg-hover, rgba(49, 50, 68, 0.4))',
        },
        '.cm-selectionBackground': {
          background: 'var(--selection-bg, rgba(137, 180, 250, 0.2)) !important',
        },
        '&.cm-focused .cm-selectionBackground': {
          background: 'var(--selection-bg, rgba(137, 180, 250, 0.3)) !important',
        },
        '.cm-cursor': {
          borderLeftColor: 'var(--interactive-accent, #89b4fa)',
          borderLeftWidth: '2px',
        },
      }),
    ];
  }

  function handleWikilinkClick(title: string) {
    onWikilinkClick?.(title);
  }

  onMount(() => {
    const state = EditorState.create({
      doc: content,
      extensions: createExtensions(),
    });

    view = new EditorView({
      state,
      parent: editorElement,
    });
  });

  onDestroy(() => {
    view?.destroy();
    view = null;
  });

  export function getContent(): string {
    return view?.state.doc.toString() ?? content;
  }

  export function focus() {
    view?.focus();
  }
</script>

<div class="editor-container" bind:this={editorElement}></div>

<style>
  .editor-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--bg-primary, #1e1e2e);
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .editor-container :global(.cm-scroller) {
    overflow: auto;
  }
</style>
