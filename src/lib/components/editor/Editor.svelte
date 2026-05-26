<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap, drawSelection, dropCursor, lineNumbers } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle, indentOnInput } from '@codemirror/language';
  import { writable } from 'svelte/store';
  import {
    wikilinkPlugin,
    wikilinkClickHandler,
    wikilinkTheme,
  } from '@/components/editor/extensions/wikilink';

  export let content: string = '';
  export let filePath: string | undefined = undefined;
  export let onContentChange: ((newContent: string) => void) | undefined = undefined;
  export let onWikilinkClick: ((target: string) => void) | undefined = undefined;
  export let onSave: ((path: string, content: string) => Promise<void>) | undefined = undefined;
  export let readOnly: boolean = false;
  export let autoSave: boolean = true;
  export let autoSaveDelay: number = 500;

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let lastMeasuredLatency = 0;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveStatus: 'saved' | 'saving' | 'unsaved' = 'saved';
  let lastSavedTime: Date | null = null;

  const noteContent = writable(content);

  onMount(() => {
    const startState = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        EditorView.lineWrapping,
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        wikilinkPlugin,
        wikilinkClickHandler,
        wikilinkTheme,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const startTime = performance.now();
            const newContent = update.state.doc.toString();
            noteContent.set(newContent);

            if (onContentChange) {
              onContentChange(newContent);
            }

            const endTime = performance.now();
            lastMeasuredLatency = endTime - startTime;

            if (lastMeasuredLatency > 16) {
              console.warn(`Editor latency: ${lastMeasuredLatency.toFixed(2)}ms (target: <16ms)`);
            }

            // Auto-save logic
            if (autoSave && onSave && filePath) {
              saveStatus = 'unsaved';
              if (saveTimer) {
                clearTimeout(saveTimer);
              }
              saveTimer = setTimeout(async () => {
                saveStatus = 'saving';
                try {
                  await onSave(filePath!, newContent);
                  saveStatus = 'saved';
                  lastSavedTime = new Date();
                } catch (error) {
                  console.error('Auto-save failed:', error);
                  saveStatus = 'unsaved';
                }
              }, autoSaveDelay);
            }
          }
        }),
        EditorState.readOnly.of(readOnly),
      ],
    });

    editorView = new EditorView({
      state: startState,
      parent: editorContainer,
    });

    editorContainer.addEventListener('wikilink-click', ((event: CustomEvent) => {
      if (onWikilinkClick) {
        onWikilinkClick(event.detail.target);
      }
    }) as EventListener);
  });

  onDestroy(() => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
  });

  export function getContent(): string {
    return editorView ? editorView.state.doc.toString() : content;
  }

  export function setContent(newContent: string) {
    if (editorView) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newContent,
        },
      });
    }
  }

  export function focus() {
    if (editorView) {
      editorView.focus();
    }
  }
</script>

<div class="editor-wrapper">
  <div bind:this={editorContainer} class="editor-container"></div>
  {#if autoSave && filePath}
    <div
      class="save-indicator"
      class:saving={saveStatus === 'saving'}
      class:unsaved={saveStatus === 'unsaved'}
    >
      {#if saveStatus === 'saving'}
        <span class="status-icon">⏳</span>
        <span>Saving...</span>
      {:else if saveStatus === 'saved' && lastSavedTime}
        <span class="status-icon">✓</span>
        <span>Saved at {lastSavedTime.toLocaleTimeString()}</span>
      {:else if saveStatus === 'unsaved'}
        <span class="status-icon">●</span>
        <span>Unsaved changes</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .editor-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .editor-container {
    width: 100%;
    height: 100%;
  }

  :global(.cm-editor) {
    height: 100%;
    font-family: var(--font-text);
    font-size: var(--font-text-size);
    background-color: var(--background-primary);
    color: var(--text-normal);
  }

  :global(.cm-scroller) {
    overflow: auto;
    font-family: var(--font-text);
  }

  :global(.cm-content) {
    padding: 1rem;
    caret-color: var(--text-accent);
  }

  :global(.cm-line) {
    padding: 0 0.5rem;
    line-height: 1.6;
  }

  :global(.cm-gutters) {
    background-color: var(--background-secondary);
    color: var(--text-muted);
    border-right: 1px solid var(--background-modifier-border);
  }

  :global(.cm-activeLineGutter) {
    background-color: var(--background-primary-alt);
  }

  :global(.cm-activeLine) {
    background-color: var(--background-primary-alt);
  }

  :global(.cm-selectionBackground) {
    background-color: var(--text-selection) !important;
  }

  :global(.cm-cursor) {
    border-left-color: var(--text-accent);
  }

  :global(.cm-focused .cm-selectionBackground) {
    background-color: var(--text-selection) !important;
  }

  .save-indicator {
    position: absolute;
    bottom: 0.5rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--text-muted);
    pointer-events: none;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .save-indicator.saving {
    color: var(--text-accent);
    opacity: 1;
  }

  .save-indicator.unsaved {
    color: var(--text-warning, #ff9800);
    opacity: 1;
  }

  .status-icon {
    font-size: 1rem;
    line-height: 1;
  }
</style>
