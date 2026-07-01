<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, lineNumbers, drawSelection, dropCursor, keymap, scrollPastEnd } from '@codemirror/view';
  import { EditorState, Compartment, type Extension } from '@codemirror/state';
  import { indentUnit } from '@codemirror/language';
  import { buildEditorTheme } from '@/components/editor/extensions/editorTheme';
  import { markdown } from '@codemirror/lang-markdown';
  import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
  import { wikilinkExtension } from '@/components/editor/extensions/wikilink';
  import { livePreviewPlugin, livePreviewTheme } from '@/components/editor/extensions/live-preview/livePreview';
  import { formattingKeymap } from '@/components/editor/extensions/formattingKeymap';
  import { markdownAutoPair } from '@/components/editor/extensions/markdownAutoPair';
  import { loadDeferredExtensions } from '@/components/editor/extensions/lazyExtensions';
  import { highlightClickPlugin, highlightClickTheme } from '@/components/editor/extensions/highlightClick';
  import { pasteUrlIntoSelection } from '@/components/editor/extensions/pasteUrlIntoSelection';
  import {
    typewriterMode,
    typewriterFacet, zenFacet,
  } from '@/components/editor/extensions/typewriterMode';
  import { zoomExtension, setZoomRange, zoomIn, zoomOnClick } from '@/features/zoom';
  import { editorSettings } from '@/features/settings';
  import { get } from 'svelte/store';
  import { buildVimExtension, reconfigureVim, loadAndApplyVimrc, vimModeLabel } from '@/features/vim';
  import { registerStatusItem, removeStatusItem } from '@/stores/status/status';
  import { buildKeyshotsKeymap, getKeyshotsConfig, onPresetChange } from '@/features/keyshots';
  import { log } from '@/utils/logger';

  export let content: string = '';
  export let readonly: boolean = false;
  export let livePreview: boolean = false;
  export let onContentChange: ((content: string) => void) | undefined = undefined;
  export let onWikilinkClick: ((title: string) => void) | undefined = undefined;

  let editorElement: HTMLDivElement;
  let view: EditorView | null = null;
  let mounted = false;
  const livePreviewCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();
  const spellCheckCompartment = new Compartment();
  const wordWrapCompartment = new Compartment();
  const closeBracketsCompartment = new Compartment();
  const indentCompartment = new Compartment();
  const typewriterCompartment = new Compartment();
  const zenCompartment = new Compartment();
  const keyshotsCompartment = new Compartment();
  const deferredCompartment = new Compartment();
  let lastVimEnabled = false;

  $: if (view && content !== view.state.doc.toString()) {
    try {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    } catch (err) {
      log.error('Editor: content sync failed', err as Error);
    }
  }

  $: livePreviewEnabled = livePreview;
  $: if (mounted && view && typeof livePreviewEnabled === 'boolean') {
    log.debug('Editor: reconfiguring live preview', { livePreviewEnabled, mounted, hasView: !!view });
    try {
      const extensions = livePreviewEnabled ? [livePreviewPlugin, livePreviewTheme, codeStylerTheme, flashcardWidgetTheme, highlightClickPlugin, highlightClickTheme] : [];
      view.dispatch({
        effects: livePreviewCompartment.reconfigure(extensions),
      });
      log.info('Editor: live preview reconfigure successful', { enabled: livePreviewEnabled });
    } catch (err) {
      log.error('Editor: live preview reconfigure FAILED', err as Error);
    }
  }

  $: if (mounted && view) {
    try {
      view.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readonly)),
      });
    } catch (err) {
      log.error('Editor: readOnly reconfigure failed', err as Error);
    }
  }

  function createExtensions() {
    const es = $editorSettings;
    const baseExtensions = [
      lineNumbers(),
      history(),
      drawSelection(),
      dropCursor(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown(),
      keymap.of([...formattingKeymap, ...defaultKeymap, ...historyKeymap]),
      keyshotsCompartment.of(keymap.of(buildKeyshotsKeymap(getKeyshotsConfig().preset))),
      wikilinkExtension(handleWikilinkClick),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          onContentChange?.(newContent);
        }
      }),
      livePreviewCompartment.of(livePreview ? [livePreviewPlugin, livePreviewTheme, highlightClickPlugin, highlightClickTheme] : []),
      readOnlyCompartment.of(EditorState.readOnly.of(readonly)),
      themeCompartment.of(buildEditorTheme(es)),
      spellCheckCompartment.of(
        EditorView.contentAttributes.of({ spellcheck: String(es.spellCheck) })
      ),
    ];

    baseExtensions.push(
      wordWrapCompartment.of(es.wordWrap ? EditorView.lineWrapping : []),
      closeBracketsCompartment.of(
        es.closeBrackets ? [closeBrackets(), keymap.of(closeBracketsKeymap)] as Extension[] : []
      ),
      indentCompartment.of([
        indentUnit.of(es.insertSpaces ? ' '.repeat(es.tabSize) : '	'),
        EditorState.tabSize.of(es.tabSize),
      ]),
    );

    baseExtensions.push(scrollPastEnd());

    baseExtensions.push(markdownAutoPair);
    baseExtensions.push(pasteUrlIntoSelection);

    // Deferred feature extensions (footnotes, symbols, dataview, metabind, music,
    // chem, progressbar, cloze, media timestamps) — loaded after mount
    baseExtensions.push(deferredCompartment.of([]));

    // Typewriter scroll + zen mode (hot-reconfigurable via compartments)
    baseExtensions.push(
      typewriterCompartment.of(typewriterFacet.of({
        enabled: es.typewriterEnabled,
        offset: es.typewriterOffset,
        onlyKeyboard: es.typewriterOnlyKeyboard,
      })),
      zenCompartment.of(zenFacet.of({
        enabled: es.zenModeEnabled,
        visibleLines: es.zenModeVisibleLines,
        dimOpacity: es.zenModeDimOpacity,
      })),
      ...typewriterMode(),
    );

    // Vim mode (hot-reconfigurable via vimCompartment inside buildVimExtension)
    baseExtensions.push(buildVimExtension(es.vimMode));
    lastVimEnabled = es.vimMode;

    // Zoom: heading/list zoom with keyboard shortcuts + bullet click
    baseExtensions.push(...zoomExtension(
      (target) => {
        const doc = view?.state.doc.toString() ?? '';
        zoomIn(doc, target);
      },
      () => get(zoomOnClick),
    ));

    return baseExtensions;
  }

  // Consolidated reactive reconfiguration — all settings applied in one tick (T062)
  $: if (mounted && view) {
    const es = $editorSettings;
    try {
      view.dispatch({
        effects: [
          themeCompartment.reconfigure(buildEditorTheme(es)),
          spellCheckCompartment.reconfigure(
            EditorView.contentAttributes.of({ spellcheck: String(es.spellCheck) })
          ),
          typewriterCompartment.reconfigure(typewriterFacet.of({
            enabled: es.typewriterEnabled,
            offset: es.typewriterOffset,
            onlyKeyboard: es.typewriterOnlyKeyboard,
          })),
          zenCompartment.reconfigure(zenFacet.of({
            enabled: es.zenModeEnabled,
            visibleLines: es.zenModeVisibleLines,
            dimOpacity: es.zenModeDimOpacity,
          })),
          wordWrapCompartment.reconfigure(es.wordWrap ? EditorView.lineWrapping : []),
          closeBracketsCompartment.reconfigure(
            es.closeBrackets ? [closeBrackets(), keymap.of(closeBracketsKeymap)] as Extension[] : []
          ),
          indentCompartment.reconfigure([
            indentUnit.of(es.insertSpaces ? ' '.repeat(es.tabSize) : '\t'),
            EditorState.tabSize.of(es.tabSize),
          ]),
        ],
      });
      // Vim mode toggle (separate from compartment dispatch above)
      if (es.vimMode !== lastVimEnabled) {
        reconfigureVim(view, es.vimMode);
        lastVimEnabled = es.vimMode;
        if (es.vimMode && es.vimrcPath) {
          loadAndApplyVimrc(es.vimrcPath).catch(err =>
            log.warn('Editor: vimrc reload failed', { error: String(err) })
          );
        }
      }
    } catch (err) {
      log.error('Editor: settings reconfigure failed', err as Error);
    }
  }

  // Vim mode status bar indicator
  $: if (mounted) {
    const es = $editorSettings;
    if (es.vimMode && es.vimShowMode) {
      registerStatusItem({ id: 'vim-mode', position: 'left', label: $vimModeLabel, priority: 1 });
    } else {
      removeStatusItem('vim-mode');
    }
  }

  function handleWikilinkClick(title: string) {
    onWikilinkClick?.(title);
  }

  function handleScrollToLine(e: Event) {
    const { line } = (e as CustomEvent<{ line: number }>).detail;
    if (!view) return;
    const doc = view.state.doc;
    const lineNum = Math.min(line + 1, doc.lines);
    const pos = doc.line(lineNum).from;
    view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'start', yMargin: 50 }) });
    view.focus();
  }

  onMount(() => {
    const extensions = createExtensions();
    const state = EditorState.create({ doc: content, extensions });
    view = new EditorView({ state, parent: editorElement });
    mounted = true;
    log.info('Editor: mounted successfully', { livePreview, mounted });
    const es = $editorSettings;
    if (es.vimMode && es.vimrcPath) {
      loadAndApplyVimrc(es.vimrcPath).catch(err =>
        log.warn('Editor: vimrc load failed on mount', { error: String(err) })
      );
    }
    window.addEventListener('editor-scroll-to-line', handleScrollToLine);

    onPresetChange((preset) => {
      if (view) {
        view.dispatch({
          effects: keyshotsCompartment.reconfigure(keymap.of(buildKeyshotsKeymap(preset))),
        });
      }
    });

    // Load deferred feature extensions after initial paint
    const scheduleDeferred = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 16);

    scheduleDeferred(() => {
      if (!view) return;
      loadDeferredExtensions({ view }).then((exts) => {
        if (view && exts.length > 0) {
          view.dispatch({ effects: deferredCompartment.reconfigure(exts) });
        }
      }).catch((err) => log.warn('Editor: deferred extension load failed', { error: String(err) }));
    });
  });

  onDestroy(() => {
    window.removeEventListener('editor-scroll-to-line', handleScrollToLine);
    removeStatusItem('vim-mode');
    view?.destroy();
    view = null;
  });

  export function getContent(): string { return view?.state.doc.toString() ?? content; }
  export function getSelectedText(): string {
    if (!view) return '';
    const { from, to } = view.state.selection.main;
    return from === to ? '' : view.state.sliceDoc(from, to);
  }
  export function focus() { view?.focus(); }

  export function applyZoomRange(range: { from: number; to: number } | null) {
    if (!view) return;
    view.dispatch({ effects: setZoomRange.of(range) });
  }

  /** Insert text at cursor, wrapping selection if prefix/suffix provided */
  export function insertAtCursor(prefix: string, suffix: string = '') {
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length, head: from + prefix.length + (selected || 'text').length },
    });
    view.focus();
  }
</script>

<div class="editor-container" bind:this={editorElement}></div>

<style>
  .editor-container { width: 100%; height: 100%; overflow: auto; background: var(--background-primary); color: var(--text-normal); }
  .editor-container :global(.cm-editor) { height: 100%; }
  .editor-container :global(.cm-scroller) { overflow: auto; }
</style>
