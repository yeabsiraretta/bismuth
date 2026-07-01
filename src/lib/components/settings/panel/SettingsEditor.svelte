<script lang="ts">
  export let fontSize: number;
  export let lineHeight: number;
  export let showLineNumbers: boolean;
  export let wordWrap: boolean;
  export let hardLineBreaks: boolean;
  export let spellCheck: boolean;
  export let tabSize: number;
  export let insertSpaces: boolean;
  export let trimTrailingWhitespace: boolean;
  export let livePreview: boolean;
  export let livePreviewMode: 'source' | 'live' | 'reading';
  export let closeBrackets: boolean;
  export let typewriterEnabled: boolean;
  export let typewriterOffset: number;
  export let typewriterOnlyKeyboard: boolean;
  export let zenModeEnabled: boolean;
  export let zenModeVisibleLines: number;
  export let zenModeDimOpacity: number;
  export let vimMode: boolean;
  export let vimrcPath: string;
  export let vimShowMode: boolean;
</script>

<div class="settings-section stack stack-md">
  <h3>Editor Settings</h3>

  <div class="setting-group">
    <h4>Typography</h4>
    <p class="setting-note">Editor font is configured in <strong>Appearance</strong> &rarr; <strong>Fonts</strong>.</p>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="font-size">Font Size</label>
        <span class="setting-hint">Base font size for the editor text</span>
      </div>
      <div class="setting-control setting-control-range">
        <input id="font-size" type="range" bind:value={fontSize} min="12" max="24" />
        <span class="setting-value">{fontSize}px</span>
      </div>
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="line-height">Line Height</label>
        <span class="setting-hint">Spacing between lines of text</span>
      </div>
      <div class="setting-control setting-control-range">
        <input id="line-height" type="range" bind:value={lineHeight} min="1.2" max="2.0" step="0.1" />
        <span class="setting-value">{lineHeight}</span>
      </div>
    </div>
  </div>

  <div class="setting-group">
    <h4>Editor Behavior</h4>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-line-numbers">Show line numbers</label>
        <span class="setting-hint">Display line numbers in the editor gutter</span>
      </div>
      <input id="cb-line-numbers" type="checkbox" bind:checked={showLineNumbers} />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-word-wrap">Word wrap</label>
        <span class="setting-hint">Wrap long lines to fit the editor width</span>
      </div>
      <input id="cb-word-wrap" type="checkbox" bind:checked={wordWrap} />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-spell-check">Spell check</label>
        <span class="setting-hint">Enable browser spell checking in the editor</span>
      </div>
      <input id="cb-spell-check" type="checkbox" bind:checked={spellCheck} />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-trim-ws">Trim trailing whitespace on save</label>
        <span class="setting-hint">Remove extra spaces at end of lines when saving</span>
      </div>
      <input id="cb-trim-ws" type="checkbox" bind:checked={trimTrailingWhitespace} />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-close-brackets">Auto-close brackets</label>
        <span class="setting-hint">Automatically close brackets and quotes</span>
      </div>
      <input id="cb-close-brackets" type="checkbox" bind:checked={closeBrackets} />
    </div>
  </div>

  <div class="setting-group">
    <h4>Indentation</h4>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="tab-size">Tab Size</label>
        <span class="setting-hint">Number of spaces per tab</span>
      </div>
      <input id="tab-size" class="setting-input-number" type="number" bind:value={tabSize} min="1" max="8" />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-insert-spaces">Insert spaces instead of tabs</label>
        <span class="setting-hint">Use spaces when pressing Tab key</span>
      </div>
      <input id="cb-insert-spaces" type="checkbox" bind:checked={insertSpaces} />
    </div>
  </div>

  <div class="setting-group">
    <h4>Markdown</h4>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label>Markdown syntax highlighting</label>
        <span class="setting-hint">Highlight Markdown syntax in editor</span>
      </div>
      <input type="checkbox" checked disabled />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-live-preview">Live preview</label>
        <span class="setting-hint">Hide markdown syntax and reveal on hover/cursor</span>
      </div>
      <input id="cb-live-preview" type="checkbox" bind:checked={livePreview} />
    </div>

    {#if livePreview}
      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="live-preview-mode">Preview mode</label>
          <span class="setting-hint">Controls how Markdown is rendered when live preview is on</span>
        </div>
        <select id="live-preview-mode" class="setting-select" bind:value={livePreviewMode}>
          <option value="source">Source</option>
          <option value="live">Live</option>
          <option value="reading">Reading</option>
        </select>
      </div>
    {/if}

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-hard-breaks">Hard line breaks</label>
        <span class="setting-hint">Render single newlines as line breaks</span>
      </div>
      <input id="cb-hard-breaks" type="checkbox" bind:checked={hardLineBreaks} />
    </div>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label>Auto-pair Markdown syntax</label>
        <span class="setting-hint">Wraps selected text with **, *, `, [[ when typing trigger</span>
      </div>
      <input type="checkbox" checked disabled />
    </div>
  </div>

  <div class="setting-group">
    <h4>Typewriter Scroll</h4>
    <p class="setting-note">Keeps the cursor line at a fixed vertical position as you type.</p>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-typewriter">Enable typewriter scroll</label>
        <span class="setting-hint">Center the active line while typing or navigating</span>
      </div>
      <input id="cb-typewriter" type="checkbox" bind:checked={typewriterEnabled} />
    </div>

    {#if typewriterEnabled}
      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="tw-offset">Scroll position</label>
          <span class="setting-hint">Vertical position for the cursor (0% top, 50% center, 100% bottom)</span>
        </div>
        <div class="setting-control setting-control-range">
          <input id="tw-offset" type="range" bind:value={typewriterOffset} min="0.15" max="0.85" step="0.05" />
          <span class="setting-value">{Math.round(typewriterOffset * 100)}%</span>
        </div>
      </div>

      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="cb-tw-keyboard">Keyboard only</label>
          <span class="setting-hint">Only scroll on keyboard input, not mouse clicks</span>
        </div>
        <input id="cb-tw-keyboard" type="checkbox" bind:checked={typewriterOnlyKeyboard} />
      </div>
    {/if}
  </div>

  <div class="setting-group">
    <h4>Zen Mode</h4>
    <p class="setting-note">Dims lines outside the cursor area for distraction-free writing.</p>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-zen">Enable zen mode</label>
        <span class="setting-hint">Dim non-active lines in the editor</span>
      </div>
      <input id="cb-zen" type="checkbox" bind:checked={zenModeEnabled} />
    </div>

    {#if zenModeEnabled}
      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="zen-radius">Visible lines</label>
          <span class="setting-hint">Lines above and below the cursor that stay fully visible</span>
        </div>
        <div class="setting-control setting-control-range">
          <input id="zen-radius" type="range" bind:value={zenModeVisibleLines} min="1" max="15" step="1" />
          <span class="setting-value">{zenModeVisibleLines}</span>
        </div>
      </div>

      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="zen-opacity">Dim opacity</label>
          <span class="setting-hint">Opacity for dimmed lines (lower = more dim)</span>
        </div>
        <div class="setting-control setting-control-range">
          <input id="zen-opacity" type="range" bind:value={zenModeDimOpacity} min="0.05" max="0.6" step="0.05" />
          <span class="setting-value">{Math.round(zenModeDimOpacity * 100)}%</span>
        </div>
      </div>
    {/if}
  </div>
  <div class="setting-group">
    <h4>Vim Mode</h4>
    <p class="setting-note">Use Vim keybindings in the editor. Place a <code>.obsidian.vimrc</code> file in your vault root for persistent configuration.</p>

    <div class="setting-item setting-row">
      <div class="setting-info">
        <label for="cb-vim">Enable Vim mode</label>
        <span class="setting-hint">Use Vim keybindings for editing (normal, insert, visual modes)</span>
      </div>
      <input id="cb-vim" type="checkbox" bind:checked={vimMode} />
    </div>

    {#if vimMode}
      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="vimrc-path">Vimrc file path</label>
          <span class="setting-hint">Relative path from vault root (e.g. .obsidian.vimrc)</span>
        </div>
        <input id="vimrc-path" class="setting-input-text" type="text" bind:value={vimrcPath} placeholder=".obsidian.vimrc" />
      </div>

      <div class="setting-item setting-row setting-indent">
        <div class="setting-info">
          <label for="cb-vim-show">Show Vim mode in status bar</label>
          <span class="setting-hint">Display current mode (NORMAL, INSERT, VISUAL) in the status bar</span>
        </div>
        <input id="cb-vim-show" type="checkbox" bind:checked={vimShowMode} />
      </div>
    {/if}
  </div>
</div>

<style>
  .setting-note { font-size: var(--font-ui-small); color: var(--text-muted); margin: 0 0 var(--spacing-s); padding: var(--spacing-xs) var(--spacing-s); background: var(--background-modifier-hover); border-radius: var(--radius-s); border-left: 2px solid var(--interactive-accent); }
  .setting-row { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-m); min-height: 36px; }
  .setting-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .setting-info > label { font-size: var(--font-ui-small); font-weight: 500; color: var(--text-normal); cursor: pointer; }
  .setting-row > input[type="checkbox"] { flex-shrink: 0; width: 18px; height: 18px; accent-color: var(--interactive-accent); cursor: pointer; }
  .setting-control { flex-shrink: 0; }
  .setting-control-range { display: flex; align-items: center; gap: var(--spacing-xs); min-width: 180px; }
  .setting-control-range input[type="range"] { flex: 1; accent-color: var(--interactive-accent); }
  .setting-select, .setting-input-number, .setting-input-text { height: 30px; padding: var(--spacing-xs) var(--spacing-s); background: var(--background-modifier-form-field); border: 1px solid var(--border-color); border-radius: var(--radius-s); font-size: var(--font-ui-small); color: var(--text-normal); outline: none; }
  .setting-select { min-width: 120px; max-width: 180px; }
  .setting-input-number { width: 64px; text-align: center; flex-shrink: 0; }
  .setting-input-text { min-width: 160px; max-width: 220px; }
  .setting-select:focus, .setting-input-number:focus, .setting-input-text:focus { border-color: var(--interactive-accent); }
  .setting-indent { padding-left: var(--spacing-l); }
</style>
