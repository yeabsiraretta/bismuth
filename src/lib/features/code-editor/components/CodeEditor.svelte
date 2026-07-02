<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { EditorView, lineNumbers, drawSelection, keymap, scrollPastEnd } from '@codemirror/view';
  import { EditorState, Compartment } from '@codemirror/state';
  import { indentUnit, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
  import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
  import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
  import { buildEditorTheme } from '@/components/editor/extensions/editorTheme';
  import { detectLanguage } from '../services/languageDetector';
  import { loadCodeEditorConfig } from '../services/languageDetector';
  import { log } from '@/utils/logger';

  export let content: string = '';
  export let filePath: string = '';
  export let readonly: boolean = false;
  export let onContentChange: ((content: string) => void) | undefined = undefined;

  const dispatch = createEventDispatcher<{ save: void }>();

  let editorElement: HTMLDivElement;
  let view: EditorView | null = null;
  const langCompartment = new Compartment();
  const wrapCompartment = new Compartment();
  const lineNumCompartment = new Compartment();

  const config = loadCodeEditorConfig();
  const langInfo = detectLanguage(filePath);

  function buildExtensions() {
    return [
      history(),
      drawSelection(),
      scrollPastEnd(),
      indentUnit.of(' '.repeat(config.tabSize)),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      closeBrackets(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        {
          key: 'Mod-s',
          run: () => {
            dispatch('save');
            return true;
          },
        },
        {
          key: 'Alt-z',
          run: (v) => {
            toggleWordWrap(v);
            return true;
          },
        },
      ]),
      lineNumCompartment.of(config.lineNumbers ? lineNumbers() : []),
      wrapCompartment.of(config.wordWrap ? EditorView.lineWrapping : []),
      langCompartment.of([]),
      buildEditorTheme(),
      EditorView.theme({
        '&': {
          fontSize: `${config.fontSize}px`,
          fontFamily: config.fontFamily,
          height: '100%',
        },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': {
          fontVariantLigatures: config.fontLigatures ? 'normal' : 'none',
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onContentChange) {
          onContentChange(update.state.doc.toString());
        }
      }),
      EditorState.readOnly.of(readonly),
    ];
  }

  function toggleWordWrap(v: EditorView) {
    const hasWrap = v.state.facet(EditorView.lineWrapping);
    v.dispatch({ effects: wrapCompartment.reconfigure(hasWrap ? [] : EditorView.lineWrapping) });
  }

  async function loadLanguageSupport() {
    if (!langInfo || !view) return;
    try {
      const ext = await getLanguageExtension(langInfo.id);
      if (ext && view) {
        view.dispatch({ effects: langCompartment.reconfigure(ext) });
      }
    } catch (err) {
      log.warn('Failed to load language support', { lang: langInfo.id, error: String(err) });
    }
  }

  async function getLanguageExtension(langId: string) {
    switch (langId) {
      case 'javascript':
      case 'typescript': {
        const { javascript } = await import('@codemirror/lang-javascript');
        return javascript({ typescript: langId === 'typescript', jsx: true });
      }
      case 'html': {
        const { html } = await import('@codemirror/lang-html');
        return html();
      }
      case 'css':
      case 'scss':
      case 'less': {
        const { css } = await import('@codemirror/lang-css');
        return css();
      }
      case 'json': {
        const { json } = await import('@codemirror/lang-json');
        return json();
      }
      case 'python': {
        const { python } = await import('@codemirror/lang-python');
        return python();
      }
      case 'rust': {
        const { rust } = await import('@codemirror/lang-rust');
        return rust();
      }
      case 'cpp':
      case 'c': {
        const { cpp } = await import('@codemirror/lang-cpp');
        return cpp();
      }
      case 'java': {
        const { java } = await import('@codemirror/lang-java');
        return java();
      }
      case 'php': {
        const { php } = await import('@codemirror/lang-php');
        return php();
      }
      case 'xml': {
        const { xml } = await import('@codemirror/lang-xml');
        return xml();
      }
      case 'sql': {
        const { sql } = await import('@codemirror/lang-sql');
        return sql();
      }
      case 'yaml': {
        const { yaml } = await import('@codemirror/lang-yaml');
        return yaml();
      }
      case 'go': {
        const { go } = await import('@codemirror/lang-go');
        return go();
      }
      default:
        return null;
    }
  }

  onMount(() => {
    const state = EditorState.create({ doc: content, extensions: buildExtensions() });
    view = new EditorView({ state, parent: editorElement });
    loadLanguageSupport();
    log.info('CodeEditor mounted', { path: filePath, lang: langInfo?.name ?? 'plain' });
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

<div class="code-editor-wrap">
  <div class="code-editor-status">
    {#if langInfo}
      <span class="lang-dot" style="background: {langInfo.color}"></span>
      <span class="lang-name">{langInfo.name}</span>
    {:else}
      <span class="lang-name">Plain Text</span>
    {/if}
    <span class="file-path">{filePath.split('/').pop()}</span>
  </div>
  <div class="code-editor-container" bind:this={editorElement}></div>
</div>

<style>
  .code-editor-wrap {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
  .code-editor-status {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    font-size: 0.75rem;
    background: var(--background-secondary);
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-color);
    user-select: none;
  }
  .lang-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .lang-name {
    font-weight: 600;
  }
  .file-path {
    margin-left: auto;
    opacity: 0.6;
  }
  .code-editor-container {
    flex: 1;
    overflow: hidden;
  }
  .code-editor-container :global(.cm-editor) {
    height: 100%;
  }
</style>
