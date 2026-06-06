<script lang="ts">
  export let fontSize: number;
  export let lineHeight: number;
  export let fontFamily: string;
  export let showLineNumbers: boolean;
  export let wordWrap: boolean;
  export let spellCheck: boolean;
  export let tabSize: number;
  export let insertSpaces: boolean;
  export let trimTrailingWhitespace: boolean;
</script>

<div class="settings-section stack stack-md">
  <h3>Editor Settings</h3>

  <div class="setting-group">
    <h4>Typography</h4>

    <div class="setting-item">
      <label for="font-family">Font Family</label>
      <select id="font-family" bind:value={fontFamily}>
        <option value="Inter">Inter</option>
        <option value="system-ui">System UI</option>
        <option value="Georgia">Georgia</option>
        <option value="'Times New Roman'">Times New Roman</option>
        <option value="'Courier New'">Courier New</option>
        <option value="'JetBrains Mono'">JetBrains Mono</option>
      </select>
      <span class="setting-hint">Font used in the editor</span>
    </div>

    <div class="setting-item">
      <label for="font-size">Font Size</label>
      <input id="font-size" type="range" bind:value={fontSize} min="12" max="24" />
      <span class="setting-value">{fontSize}px</span>
    </div>

    <div class="setting-item">
      <label for="line-height">Line Height</label>
      <input id="line-height" type="range" bind:value={lineHeight} min="1.2" max="2.0" step="0.1" />
      <span class="setting-value">{lineHeight}</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Editor Behavior</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={showLineNumbers} />
        Show line numbers
      </label>
      <span class="setting-hint">Display line numbers in the editor gutter</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={wordWrap} />
        Word wrap
      </label>
      <span class="setting-hint">Wrap long lines to fit the editor width</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={spellCheck} />
        Spell check
      </label>
      <span class="setting-hint">Enable browser spell checking</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={trimTrailingWhitespace} />
        Trim trailing whitespace on save
      </label>
      <span class="setting-hint">Remove extra spaces at end of lines when saving</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Auto-close brackets
      </label>
      <span class="setting-hint">Automatically close brackets and quotes (coming soon)</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Indentation</h4>

    <div class="setting-item">
      <label for="tab-size">Tab Size</label>
      <input id="tab-size" type="number" bind:value={tabSize} min="1" max="8" />
      <span class="setting-hint">Number of spaces per tab</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={insertSpaces} />
        Insert spaces instead of tabs
      </label>
      <span class="setting-hint">Use spaces when pressing Tab key</span>
    </div>
  </div>

  <div class="setting-group">
    <h4>Markdown</h4>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={true} disabled />
        Enable Markdown syntax highlighting
      </label>
      <span class="setting-hint">Highlight Markdown syntax in editor</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Live preview
      </label>
      <span class="setting-hint">Show rendered preview alongside editor (coming soon)</span>
    </div>

    <div class="setting-item">
      <label>
        <input type="checkbox" value={false} disabled />
        Auto-pair Markdown syntax
      </label>
      <span class="setting-hint">Auto-complete **bold**, *italic*, etc. (coming soon)</span>
    </div>
  </div>
</div>
