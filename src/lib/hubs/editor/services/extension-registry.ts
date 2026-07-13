import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from '@codemirror/language';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  scrollPastEnd,
} from '@codemirror/view';

import { buildEditorTheme } from '@/hubs/editor/services/base-theme';
import { footnoteCompletions } from '@/hubs/editor/services/footnote-extension';
import { formattingKeymap } from '@/hubs/editor/services/formatting-keymap';
import {
  frontmatterFoldExtension,
  frontmatterPropertiesExtension,
  frontmatterStyledExtension,
  frontmatterThemeExtension,
} from '@/hubs/editor/services/frontmatter-extension';
import { gfmCodeLanguages } from '@/hubs/editor/services/gfm-languages';
import { livePreviewExtension } from '@/hubs/editor/services/live-preview-extension';
import { typewriterExtension, typewriterTheme } from '@/hubs/editor/services/typewriter-extension';
import { wikilinkCompletions } from '@/hubs/editor/services/wikilink-completion';
import { wikilinkExtension } from '@/hubs/editor/services/wikilink-extension';
import { zenExtension } from '@/hubs/editor/services/zen-extension';
import type { EditorConfig } from '@/hubs/editor/types/editor-config';

export interface EditorCompartments {
  theme: Compartment;
  syntaxTheme: Compartment;
  readOnly: Compartment;
  wordWrap: Compartment;
  spellCheck: Compartment;
  closeBrackets: Compartment;
  indent: Compartment;
  lineNumbers: Compartment;
  foldGutter: Compartment;
  activeLine: Compartment;
  frontmatter: Compartment;
  livePreview: Compartment;
  typewriter: Compartment;
  zen: Compartment;
  deferred: Compartment;
}

export function createCompartments(): EditorCompartments {
  return {
    theme: new Compartment(),
    syntaxTheme: new Compartment(),
    readOnly: new Compartment(),
    wordWrap: new Compartment(),
    spellCheck: new Compartment(),
    closeBrackets: new Compartment(),
    indent: new Compartment(),
    lineNumbers: new Compartment(),
    foldGutter: new Compartment(),
    activeLine: new Compartment(),
    frontmatter: new Compartment(),
    livePreview: new Compartment(),
    typewriter: new Compartment(),
    zen: new Compartment(),
    deferred: new Compartment(),
  };
}

function getFrontmatterExtForMode(mode: 'hidden' | 'source' | 'properties') {
  switch (mode) {
    case 'source':
      return frontmatterStyledExtension();
    case 'properties':
      return frontmatterPropertiesExtension();
    case 'hidden':
    default:
      return frontmatterFoldExtension();
  }
}

export function buildExtensions(
  config: EditorConfig,
  compartments: EditorCompartments,
  onContentChange?: (content: string) => void
): Extension[] {
  return [
    compartments.lineNumbers.of(config.showLineNumbers ? lineNumbers() : []),
    highlightSpecialChars(),
    history(),
    compartments.foldGutter.of(config.showFoldGutter ? foldGutter() : []),
    drawSelection(),
    dropCursor(),
    scrollPastEnd(),
    indentOnInput(),
    compartments.syntaxTheme.of(
      syntaxHighlighting(config.darkMode ? oneDarkHighlightStyle : defaultHighlightStyle, {
        fallback: true,
      })
    ),
    bracketMatching(),
    autocompletion({
      override: [wikilinkCompletions, footnoteCompletions],
      activateOnTyping: true,
    }),
    rectangularSelection(),
    crosshairCursor(),
    compartments.activeLine.of(
      config.highlightActiveLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []
    ),
    highlightSelectionMatches(),
    markdown({ codeLanguages: gfmCodeLanguages() }),
    keymap.of([
      ...formattingKeymap,
      ...searchKeymap,
      ...foldKeymap,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onContentChange?.(update.state.doc.toString());
      }
    }),
    compartments.theme.of(buildEditorTheme(config)),
    compartments.readOnly.of(EditorState.readOnly.of(config.readOnly)),
    compartments.wordWrap.of(config.wordWrap ? EditorView.lineWrapping : []),
    compartments.spellCheck.of(
      EditorView.contentAttributes.of({ spellcheck: String(config.spellCheck) })
    ),
    compartments.closeBrackets.of(
      config.closeBrackets ? ([closeBrackets(), keymap.of(closeBracketsKeymap)] as Extension[]) : []
    ),
    compartments.indent.of([
      indentUnit.of(config.insertSpaces ? ' '.repeat(config.tabSize) : '\t'),
      EditorState.tabSize.of(config.tabSize),
    ]),
    ...wikilinkExtension(),
    ...frontmatterThemeExtension(),
    compartments.frontmatter.of(getFrontmatterExtForMode(config.frontmatterMode)),
    compartments.livePreview.of(config.livePreview ? livePreviewExtension() : []),
    compartments.typewriter.of(
      config.typewriter.typewriterEnabled
        ? [
            typewriterExtension(
              config.typewriter.typewriterOffset,
              config.typewriter.typewriterOnlyKeyboard
            ),
            typewriterTheme,
          ]
        : []
    ),
    compartments.zen.of(
      config.typewriter.zenModeEnabled
        ? zenExtension(config.typewriter.zenModeVisibleLines, config.typewriter.zenModeDimOpacity)
        : []
    ),
    compartments.deferred.of([]),
  ];
}

export function reconfigureFromConfig(
  view: EditorView,
  config: EditorConfig,
  compartments: EditorCompartments
): void {
  view.dispatch({
    effects: [
      compartments.theme.reconfigure(buildEditorTheme(config)),
      compartments.syntaxTheme.reconfigure(
        syntaxHighlighting(config.darkMode ? oneDarkHighlightStyle : defaultHighlightStyle, {
          fallback: true,
        })
      ),
      compartments.readOnly.reconfigure(EditorState.readOnly.of(config.readOnly)),
      compartments.wordWrap.reconfigure(config.wordWrap ? EditorView.lineWrapping : []),
      compartments.spellCheck.reconfigure(
        EditorView.contentAttributes.of({ spellcheck: String(config.spellCheck) })
      ),
      compartments.closeBrackets.reconfigure(
        config.closeBrackets
          ? ([closeBrackets(), keymap.of(closeBracketsKeymap)] as Extension[])
          : []
      ),
      compartments.indent.reconfigure([
        indentUnit.of(config.insertSpaces ? ' '.repeat(config.tabSize) : '\t'),
        EditorState.tabSize.of(config.tabSize),
      ]),
      compartments.lineNumbers.reconfigure(config.showLineNumbers ? lineNumbers() : []),
      compartments.foldGutter.reconfigure(config.showFoldGutter ? foldGutter() : []),
      compartments.activeLine.reconfigure(
        config.highlightActiveLine ? [highlightActiveLine(), highlightActiveLineGutter()] : []
      ),
      compartments.frontmatter.reconfigure(getFrontmatterExtForMode(config.frontmatterMode)),
      compartments.livePreview.reconfigure(config.livePreview ? livePreviewExtension() : []),
      compartments.typewriter.reconfigure(
        config.typewriter.typewriterEnabled
          ? [
              typewriterExtension(
                config.typewriter.typewriterOffset,
                config.typewriter.typewriterOnlyKeyboard
              ),
              typewriterTheme,
            ]
          : []
      ),
      compartments.zen.reconfigure(
        config.typewriter.zenModeEnabled
          ? zenExtension(config.typewriter.zenModeVisibleLines, config.typewriter.zenModeDimOpacity)
          : []
      ),
    ],
  });
}
