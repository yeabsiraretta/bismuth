<script lang="ts">
  import SettingRow from '@/ui/settings-controls.svelte';
  import type { EditorSettings, TypewriterSettings, VimSettings } from '@/hubs/core/types/settings';

  let {
    editor = $bindable(),
    typewriter = $bindable(),
    vim = $bindable(),
  }: {
    editor: EditorSettings;
    typewriter: TypewriterSettings;
    vim: VimSettings;
  } = $props();
</script>

<div class="space-y-6">
  <section>
    <h3 class="text-s font-semibold text-text mb-3">Typography</h3>
    <p class="text-xs text-text-subtle mb-2">
      Editor font is configured in Appearance &rarr; Fonts.
    </p>

    <SettingRow label="Font Size" hint="Base font size for editor text" id="font-size">
      <div class="flex">
        <input id="font-size" type="range" bind:value={editor.fontSize} min="12" max="24" />
        <span>{editor.fontSize}px</span>
      </div>
    </SettingRow>

    <SettingRow label="Line Height" hint="Spacing between lines of text" id="line-height">
      <div class="flex">
        <input
          id="line-height"
          type="range"
          bind:value={editor.lineHeight}
          min="1.2"
          max="2.0"
          step="0.1"
        />
        <span>{editor.lineHeight}</span>
      </div>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Editor Behavior</h3>

    <SettingRow
      label="Show line numbers"
      hint="Display line numbers in the editor gutter"
      id="line-numbers"
    >
      <input id="line-numbers" type="checkbox" bind:checked={editor.showLineNumbers} />
    </SettingRow>

    <SettingRow
      label="Fold gutter"
      hint="Show fold arrows in the gutter to collapse sections"
      id="fold-gutter"
    >
      <input id="fold-gutter" type="checkbox" bind:checked={editor.showFoldGutter} />
    </SettingRow>

    <SettingRow
      label="Highlight active line"
      hint="Visually highlight the line the cursor is on"
      id="highlight-line"
    >
      <input id="highlight-line" type="checkbox" bind:checked={editor.highlightActiveLine} />
    </SettingRow>

    <SettingRow
      label="Readable line length"
      hint="Constrain content to a maximum width for readability"
      id="readable-line"
    >
      <input id="readable-line" type="checkbox" bind:checked={editor.readableLineLength} />
    </SettingRow>

    {#if editor.readableLineLength}
      <SettingRow label="Line width" hint="Maximum width in characters" id="line-width">
        <div class="flex">
          <input
            id="line-width"
            type="range"
            bind:value={editor.readableLineLengthWidth}
            min="40"
            max="120"
            step="5"
          />
          <span>{editor.readableLineLengthWidth}ch</span>
        </div>
      </SettingRow>
    {/if}

    <SettingRow
      label="Frontmatter"
      hint="How YAML frontmatter is displayed in the editor"
      id="frontmatter-mode"
    >
      <select id="frontmatter-mode" bind:value={editor.frontmatterMode} style="width:128px">
        <option value="hidden">Hidden</option>
        <option value="source">Source</option>
        <option value="properties">Properties</option>
      </select>
    </SettingRow>

    <SettingRow label="Word wrap" hint="Wrap long lines to fit the editor width" id="word-wrap">
      <input id="word-wrap" type="checkbox" bind:checked={editor.wordWrap} />
    </SettingRow>

    <SettingRow
      label="Spell check"
      hint="Enable browser spell checking in the editor"
      id="spell-check"
    >
      <input id="spell-check" type="checkbox" bind:checked={editor.spellCheck} />
    </SettingRow>

    <SettingRow
      label="Trim trailing whitespace"
      hint="Remove extra spaces at end of lines when saving"
      id="trim-ws"
    >
      <input id="trim-ws" type="checkbox" bind:checked={editor.trimTrailingWhitespace} />
    </SettingRow>

    <SettingRow
      label="Auto-close brackets"
      hint="Automatically close brackets and quotes"
      id="close-brackets"
    >
      <input id="close-brackets" type="checkbox" bind:checked={editor.closeBrackets} />
    </SettingRow>

    <SettingRow label="Tab size" hint="Number of spaces per tab" id="tab-size">
      <select id="tab-size" bind:value={editor.tabSize}>
        <option value={2}>2</option>
        <option value={4}>4</option>
        <option value={8}>8</option>
      </select>
    </SettingRow>

    <SettingRow
      label="Insert spaces"
      hint="Use spaces instead of tab characters"
      id="insert-spaces"
    >
      <input id="insert-spaces" type="checkbox" bind:checked={editor.insertSpaces} />
    </SettingRow>

    <SettingRow
      label="Hard line breaks"
      hint="Treat single newlines as hard line breaks in markdown"
      id="hard-breaks"
    >
      <input id="hard-breaks" type="checkbox" bind:checked={editor.hardLineBreaks} />
    </SettingRow>

    <SettingRow
      label="Slash commands"
      hint="Press / outside the editor to open the command palette"
      id="slash-commands"
    >
      <input id="slash-commands" type="checkbox" bind:checked={editor.slashCommands} />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">View Mode</h3>

    <SettingRow
      label="Enable live preview"
      hint="Allow live preview and reading modes (when off, always uses source mode)"
      id="live-preview"
    >
      <input id="live-preview" type="checkbox" bind:checked={editor.livePreview} />
    </SettingRow>

    {#if editor.livePreview}
      <SettingRow
        label="Default view mode"
        hint="View mode when opening a note"
        id="live-preview-mode"
      >
        <select id="live-preview-mode" bind:value={editor.livePreviewMode}>
          <option value="live">Live Preview</option>
          <option value="source">Source</option>
          <option value="reading">Reading</option>
        </select>
      </SettingRow>
    {/if}

    <SettingRow
      label="Floating toolbar"
      hint="Show formatting toolbar above selected text"
      id="floating-toolbar"
    >
      <input id="floating-toolbar" type="checkbox" bind:checked={editor.floatingToolbar} />
    </SettingRow>

    <SettingRow label="Read-only mode" hint="Prevent editing note content" id="read-only">
      <input id="read-only" type="checkbox" bind:checked={editor.readOnly} />
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Speed Reader</h3>

    <SettingRow
      label="Default WPM"
      hint="Words per minute when opening the speed reader"
      id="speed-wpm"
    >
      <div class="flex">
        <input
          id="speed-wpm"
          type="range"
          bind:value={editor.defaultSpeedReaderWpm}
          min="50"
          max="1500"
          step="25"
        />
        <span>{editor.defaultSpeedReaderWpm}</span>
      </div>
    </SettingRow>
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Typewriter &amp; Zen Mode</h3>

    <SettingRow
      label="Typewriter mode"
      hint="Keep cursor centered vertically while typing"
      id="typewriter"
    >
      <input id="typewriter" type="checkbox" bind:checked={typewriter.typewriterEnabled} />
    </SettingRow>

    {#if typewriter.typewriterEnabled}
      <SettingRow
        label="Typewriter offset"
        hint="Vertical position of the cursor (0 = top, 1 = bottom)"
        id="tw-offset"
      >
        <div class="flex">
          <input
            id="tw-offset"
            type="range"
            bind:value={typewriter.typewriterOffset}
            min="0"
            max="1"
            step="0.05"
          />
          <span>{typewriter.typewriterOffset}</span>
        </div>
      </SettingRow>

      <SettingRow
        label="Only on keyboard input"
        hint="Don't scroll on mouse clicks"
        id="tw-keyboard"
      >
        <input id="tw-keyboard" type="checkbox" bind:checked={typewriter.typewriterOnlyKeyboard} />
      </SettingRow>
    {/if}

    <SettingRow
      label="Zen mode"
      hint="Dim non-focused text for distraction-free writing"
      id="zen-mode"
    >
      <input id="zen-mode" type="checkbox" bind:checked={typewriter.zenModeEnabled} />
    </SettingRow>

    {#if typewriter.zenModeEnabled}
      <SettingRow label="Visible lines" hint="Number of lines to keep un-dimmed" id="zen-lines">
        <div class="flex">
          <input
            id="zen-lines"
            type="range"
            bind:value={typewriter.zenModeVisibleLines}
            min="1"
            max="15"
          />
          <span>{typewriter.zenModeVisibleLines}</span>
        </div>
      </SettingRow>

      <SettingRow label="Dim opacity" hint="How much to dim unfocused text" id="zen-opacity">
        <div class="flex">
          <input
            id="zen-opacity"
            type="range"
            bind:value={typewriter.zenModeDimOpacity}
            min="0.05"
            max="0.8"
            step="0.05"
          />
          <span>{typewriter.zenModeDimOpacity}</span>
        </div>
      </SettingRow>
    {/if}
  </section>

  <section>
    <h3 class="text-s font-semibold text-text mb-3">Vim</h3>

    <SettingRow label="Vim mode" hint="Enable vim keybindings in the editor" id="vim-mode">
      <input id="vim-mode" type="checkbox" bind:checked={vim.vimMode} />
    </SettingRow>

    {#if vim.vimMode}
      <SettingRow
        label="Show mode indicator"
        hint="Display current vim mode in the status bar"
        id="vim-show"
      >
        <input id="vim-show" type="checkbox" bind:checked={vim.vimShowMode} />
      </SettingRow>

      <SettingRow label="Vimrc path" hint="Path to custom vimrc file" id="vimrc">
        <input id="vimrc" type="text" style="width:160px" bind:value={vim.vimrcPath} />
      </SettingRow>
    {/if}
  </section>
</div>
